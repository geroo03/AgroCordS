"use client";

import { useState } from "react";
import Boton from "@/components/ui/Boton";
import ErrorEstado from "@/components/ui/ErrorEstado";
import Paywall from "@/components/ui/Paywall";
import { construirContextoLote } from "@/lib/chat/contexto";
import { consultasRestantesHoy, registrarConsultaChat } from "@/lib/chat/limite";
import type { MensajeChat, RespuestaChat } from "@/lib/chat/tipos";
import { esPremium } from "@/lib/plan";
import type { ValorDecision } from "@/lib/riesgo";
import type { Diagnostico } from "@/lib/sintesis";
import type { Aplicacion } from "@/lib/tipos";

interface Props {
  readonly lote: { readonly nombre: string; readonly cultivo: string | null; readonly areaHa: number };
  readonly diagnostico: Diagnostico;
  readonly valor: ValorDecision | null;
  readonly aplicaciones: readonly Aplicacion[];
  readonly onCerrar: () => void;
}

/** Un mensaje ya mostrado en pantalla; las acciones sólo existen en la vista, no viajan de vuelta al servidor. */
interface MensajeVista extends MensajeChat {
  readonly acciones?: readonly string[];
}

/** Últimos mensajes que se reenvían como historial en cada consulta nueva. */
const MAX_HISTORIAL_ENVIADO = 8;

export default function VentanaChat({ lote, diagnostico, valor, aplicaciones, onCerrar }: Props) {
  const [mensajes, setMensajes] = useState<MensajeVista[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premium, setPremium] = useState(() => esPremium());
  const [restantes, setRestantes] = useState(() => consultasRestantesHoy(esPremium()));

  const enviar = (mensajeAEnviar: string) => {
    const pregunta = mensajeAEnviar.trim();
    if (!pregunta || cargando) return;

    const historialPrevio = mensajes.slice(-MAX_HISTORIAL_ENVIADO).map((m) => ({
      rol: m.rol,
      texto: m.texto,
    }));

    setMensajes((prev) => [...prev, { rol: "usuario", texto: pregunta }]);
    setTexto("");
    setCargando(true);
    setError(null);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensaje: pregunta,
        contexto: construirContextoLote(lote, diagnostico, valor, aplicaciones),
        historial: historialPrevio,
      }),
    })
      .then((r) =>
        r.ok ? (r.json() as Promise<RespuestaChat>) : Promise.reject(new Error(String(r.status))),
      )
      .then((respuesta) => {
        setMensajes((prev) => [
          ...prev,
          { rol: "asistente", texto: respuesta.respuesta, acciones: respuesta.acciones },
        ]);
        registrarConsultaChat();
        setRestantes(consultasRestantesHoy(premium));
      })
      .catch(() => setError("El asistente no responde en este momento. Reintentá en unos minutos."))
      .finally(() => setCargando(false));
  };

  const sinConsultas = !premium && restantes <= 0;

  return (
    <>
      {/* Fondo que oscurece el resto de la pantalla y cierra al tocarlo. */}
      <button
        type="button"
        aria-label="Cerrar asistente"
        onClick={onCerrar}
        className="fixed inset-0 z-[55] bg-tinta/40"
      />
      <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex h-[80dvh] w-full max-w-[480px] flex-col rounded-t-2xl border-t border-niebla bg-papel shadow-2xl">
        <header className="flex items-center justify-between border-b border-niebla px-5 py-3">
          <div>
            <p className="text-xs font-semibold text-tinta/60">Asistente del lote</p>
            <p className="text-base font-bold">{lote.nombre}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center text-2xl text-tinta/60"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {mensajes.length === 0 ? (
            <p className="text-sm leading-relaxed text-tinta/70">
              Preguntame sobre este lote — por ejemplo &ldquo;¿puedo aplicar mañana a la
              mañana?&rdquo; o &ldquo;por qué hay atención en agua?&rdquo;. Respondo con lo mismo
              que ves en el diagnóstico de arriba, nunca con datos inventados.
            </p>
          ) : null}

          {mensajes.map((m, i) => (
            <BurbujaMensaje key={i} mensaje={m} />
          ))}

          {cargando ? <p className="text-sm text-tinta/50">El asistente está escribiendo…</p> : null}
        </div>

        {error ? (
          <div className="px-5 pb-2">
            <ErrorEstado mensaje={error} onReintentar={() => enviar(mensajes.at(-1)?.texto ?? "")} />
          </div>
        ) : null}

        <footer className="border-t border-niebla px-5 py-3">
          {sinConsultas ? (
            <Paywall
              titulo="Seguí consultando al asistente"
              descripcion="Usaste tus 5 consultas gratis de hoy. Activá Premium para consultas ilimitadas."
              onActivado={() => {
                setPremium(true);
                setRestantes(Infinity);
              }}
            />
          ) : (
            <>
              {!premium ? (
                <p className="mb-2 text-xs text-tinta/60">Te quedan {restantes} consultas hoy.</p>
              ) : null}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  enviar(texto);
                }}
                className="flex items-end gap-2"
              >
                <label className="flex-1">
                  <span className="sr-only">Tu pregunta para el asistente</span>
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribí tu pregunta…"
                    className="min-h-11 w-full rounded-lg border border-niebla bg-papel px-3 text-base outline-none focus:border-pizarra"
                  />
                </label>
                <Boton type="submit" disabled={cargando || texto.trim().length === 0}>
                  Enviar
                </Boton>
              </form>
            </>
          )}
        </footer>
      </div>
    </>
  );
}

function BurbujaMensaje({ mensaje }: { mensaje: MensajeVista }) {
  const esUsuario = mensaje.rol === "usuario";
  return (
    <div className={`flex ${esUsuario ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${esUsuario ? "bg-pizarra text-white" : "bg-niebla/60 text-tinta"}`}>
        <p className="text-sm leading-relaxed whitespace-pre-line">{mensaje.texto}</p>
        {mensaje.acciones && mensaje.acciones.length > 0 ? (
          <div className="mt-2 border-t border-tinta/10 pt-2">
            <p className="text-xs font-semibold">Acciones sugeridas</p>
            <ul className="mt-1 space-y-1">
              {mensaje.acciones.map((accion, i) => (
                <li key={i} className="text-sm leading-snug">
                  • {accion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
