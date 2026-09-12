"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import Boton from "@/components/ui/Boton";
import ErrorEstado from "@/components/ui/ErrorEstado";
import Paywall from "@/components/ui/Paywall";
import Vacio from "@/components/ui/Vacio";
import { listarLotes } from "@/lib/almacen";
import { ETIQUETA_ESTADO, etiquetaDia, hectareas, horaCorta } from "@/lib/formato";
import {
  avisarSiVentanaAbierta,
  pedirPermiso,
  permisoActual,
  permisoDisponible,
} from "@/lib/notificaciones";
import { esPremium } from "@/lib/plan";
import type { ProductType } from "@/lib/spray-engine";
import type { ForecastResponsePayload, Lote } from "@/lib/tipos";

interface Registro {
  lote: Lote;
  datos: ForecastResponsePayload | "error";
}

export default function PaginaVentanas() {
  const [tipoProducto, setTipoProducto] = useState<ProductType>("sistemico");
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [sinLotes, setSinLotes] = useState(false);
  const [premium, setPremium] = useState(false);
  const [permiso, setPermiso] = useState<NotificationPermission | "no_disponible">(
    "no_disponible",
  );

  useEffect(() => {
    esPremium().then(setPremium);
    setPermiso(permisoActual());
  }, []);

  const activarAvisos = () => {
    pedirPermiso().then(setPermiso);
  };

  const consultar = useCallback(async () => {
    const lotes = await listarLotes();
    if (lotes.length === 0) {
      setSinLotes(true);
      setRegistros([]);
      return;
    }
    setSinLotes(false);
    setRegistros(null);
    const resultado = await Promise.all(
      lotes.map(async (lote): Promise<Registro> => {
        try {
          const r = await fetch(
            `/api/forecast?lat=${lote.centroidLat}&lng=${lote.centroidLng}&productType=${tipoProducto}`,
          );
          if (!r.ok) throw new Error(String(r.status));
          return { lote, datos: (await r.json()) as ForecastResponsePayload };
        } catch {
          return { lote, datos: "error" };
        }
      }),
    );
    // Primero los lotes con ventana más próxima; los ISO locales ordenan bien.
    const masProxima = (r: Registro): string | null =>
      r.datos === "error" || r.datos.windows.length === 0
        ? null
        : r.datos.windows.reduce(
            (min, v) => (v.startTime < min ? v.startTime : min),
            r.datos.windows[0].startTime,
          );
    resultado.sort((a, b) => {
      const va = masProxima(a);
      const vb = masProxima(b);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return va.localeCompare(vb);
    });
    setRegistros(resultado);

    // Premium: avisar del navegador si alguna mejor ventana ya está
    // abierta ahora y todavía no se avisó para ese lote+ventana.
    if (await esPremium()) {
      for (const { lote, datos } of resultado) {
        if (datos !== "error") avisarSiVentanaAbierta(lote, datos.windows[0] ?? null);
      }
    }
  }, [tipoProducto]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  return (
    <div className="px-5 pb-24">
      <header className="py-5">
        <h1 className="text-2xl font-extrabold">Ventanas de aplicación</h1>
        <p className="mt-1 text-base text-tinta/70">
          Cuándo se puede aplicar en cada lote, en las próximas 72 h.
        </p>
      </header>

      <div
        role="group"
        aria-label="Tipo de producto"
        className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-niebla p-1"
      >
        {(["sistemico", "contacto"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tipoProducto === t}
            onClick={() => setTipoProducto(t)}
            className={`min-h-11 rounded-lg text-base font-semibold transition-colors duration-200 ${
              tipoProducto === t ? "bg-pizarra text-white" : "text-tinta"
            }`}
          >
            {t === "sistemico" ? "Sistémico" : "Contacto"}
          </button>
        ))}
      </div>

      {!premium ? (
        <div className="mb-4">
          <Paywall
            titulo="🔔 Avisos automáticos — Premium"
            descripcion="Te avisamos con una notificación apenas se abra la mejor ventana de cada lote, sin tener que entrar a revisar."
            onActivado={() => setPremium(true)}
          />
        </div>
      ) : !permisoDisponible() ? null : permiso === "granted" ? (
        <p className="mb-4 rounded-lg bg-optima/10 p-2 text-sm font-medium text-optima">
          🔔 Avisos activados: te notificamos apenas se abra una ventana.
        </p>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-niebla p-3">
          <p className="text-sm text-tinta/80">
            Activá los avisos del navegador para no tener que entrar a revisar.
          </p>
          <Boton variante="secundario" onClick={activarAvisos} className="shrink-0">
            Activar avisos
          </Boton>
        </div>
      )}

      {sinLotes ? (
        <div className="space-y-3">
          <Vacio>Todavía no cargaste ningún lote, así que no hay ventanas que calcular.</Vacio>
          <Link href="/lotes" className="block font-semibold text-pizarra underline">
            Ir a cargar un lote
          </Link>
        </div>
      ) : registros === null ? (
        <ul className="space-y-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-xl bg-niebla" />
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {registros.map(({ lote, datos }) => (
            <li key={lote.id}>
              <Link
                href={`/lotes/${lote.id}`}
                className="flex items-center gap-3 rounded-xl border border-niebla p-3"
              >
                <MiniaturaLote lote={lote} className="h-16 w-16" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold">{lote.nombre}</span>
                  <span className="block text-sm text-tinta/70">
                    {lote.cultivo ? `${lote.cultivo} · ` : ""}
                    {hectareas(lote.areaHa)}
                  </span>
                  {datos === "error" ? (
                    <span className="mt-1 block text-sm text-tinta/60">
                      Sin pronóstico ahora. Entrá al lote para reintentar.
                    </span>
                  ) : datos.windows.length === 0 ? (
                    <span className="mt-1 block text-sm font-medium text-bloqueo">
                      Sin ventanas de 2+ h en 72 h
                    </span>
                  ) : (
                    <span className="mt-1 block text-sm">
                      {datos.windows.slice(0, 2).map((v) => (
                        <span key={v.startTime} className="block">
                          <span className="font-semibold text-optima">
                            {etiquetaDia(v.startTime.slice(0, 10))} {horaCorta(v.startTime)}
                          </span>{" "}
                          · {v.hours} h ·{" "}
                          {ETIQUETA_ESTADO[v.bestSuitability].toLowerCase()}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {registros !== null && registros.some((r) => r.datos === "error") ? (
        <div className="mt-4">
          <ErrorEstado
            mensaje="No pudimos traer el pronóstico de algunos lotes."
            onReintentar={consultar}
          />
        </div>
      ) : null}
    </div>
  );
}
