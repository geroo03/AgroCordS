"use client";

import { useEffect, useState } from "react";
import Boton from "@/components/ui/Boton";
import ErrorEstado from "@/components/ui/ErrorEstado";
import IconoClay from "@/components/ui/IconoClay";
import Paywall from "@/components/ui/Paywall";
import { GlifoChat, GlifoIdea } from "@/components/ui/iconos/Glifos";
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
  const [premium, setPremium] = useState(false);
  const [restantes, setRestantes] = useState(0);

  useEffect(() => {
    let vigente = true;
    esPremium().then((p) => {
      if (!vigente) return;
      setPremium(p);
      consultasRestantesHoy(p).then((r) => {
        if (vigente) setRestantes(r);
      });
    });
    return () => {
      vigente = false;
    };
  }, []);

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
        registrarConsultaChat().then(() =>
          consultasRestantesHoy(premium).then(setRestantes),
        );
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
        className="fixed inset-0 z-[55] bg-tinta/50"
      />
      <div className="clay-elevado fixed inset-x-0 bottom-0 z-[60] mx-auto flex h-[85dvh] w-full max-w-2xl flex-col rounded-t-3xl">
        <header className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <IconoClay tono="azul" tamano="md">
              <GlifoChat />
            </IconoClay>
            <div>
              <p className="text-sm font-semibold text-tinta/60">Asistente del lote</p>
              <p className="text-xl font-extrabold text-tinta">{lote.nombre}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="clay-elevado flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-tinta/60 active:scale-95"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {mensajes.length === 0 ? (
            <div className="clay-hundido flex items-start gap-3 rounded-2xl p-4">
              <IconoClay tono="neutro" tamano="sm">
                <GlifoChat />
              </IconoClay>
              <p className="text-base leading-relaxed font-medium text-tinta/80">
                Preguntame sobre este lote — por ejemplo &ldquo;¿puedo aplicar mañana a la
                mañana?&rdquo; o &ldquo;por qué hay atención en agua?&rdquo;. Respondo con lo
                mismo que ves en el diagnóstico de arriba, nunca con datos inventados.
              </p>
            </div>
          ) : null}

          {mensajes.map((m, i) => (
            <BurbujaMensaje key={i} mensaje={m} />
          ))}

          {cargando ? (
            <div className="flex items-center gap-3">
              <IconoClay tono="neutro" tamano="sm">
                <GlifoChat />
              </IconoClay>
              <p className="text-base font-medium text-tinta/60">El asistente está escribiendo…</p>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="px-5 pb-2">
            <ErrorEstado mensaje={error} onReintentar={() => enviar(mensajes.at(-1)?.texto ?? "")} />
          </div>
        ) : null}

        <footer className="px-5 pt-3 pb-5">
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
                <p className="mb-2 text-sm font-medium text-tinta/60">
                  Te quedan {restantes} consultas hoy.
                </p>
              ) : null}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  enviar(texto);
                }}
                className="flex items-end gap-3"
              >
                <label className="flex-1">
                  <span className="sr-only">Tu pregunta para el asistente</span>
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribí tu pregunta…"
                    className="clay-hundido min-h-16 w-full rounded-2xl px-4 text-lg font-medium text-tinta outline-none placeholder:text-tinta/40 focus:ring-2 focus:ring-pizarra"
                  />
                </label>
                <Boton type="submit" disabled={cargando || texto.trim().length === 0} className="min-h-16">
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
    <div className={`flex items-start gap-2.5 ${esUsuario ? "flex-row-reverse" : ""}`}>
      {esUsuario ? null : (
        <div className="shrink-0">
          <IconoClay tono="neutro" tamano="sm">
            <GlifoChat />
          </IconoClay>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          esUsuario ? "clay-boton-primario text-white" : "clay-hundido text-tinta"
        }`}
      >
        <p className="text-base leading-relaxed font-medium whitespace-pre-line">{mensaje.texto}</p>
        {mensaje.acciones && mensaje.acciones.length > 0 ? (
          <div className="mt-3 border-t border-tinta/10 pt-3">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <span className="h-4 w-4">
                <GlifoIdea />
              </span>
              Acciones sugeridas
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {mensaje.acciones.map((accion, i) => (
                <li key={i} className="text-base leading-snug font-medium">
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
