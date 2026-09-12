"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import Boton from "@/components/ui/Boton";
import BotonSesion from "@/components/ui/BotonSesion";
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
    setPremium(esPremium());
    setPermiso(permisoActual());
  }, []);

  const activarAvisos = () => {
    pedirPermiso().then(setPermiso);
  };

  const consultar = useCallback(() => {
    const lotes = listarLotes();
    if (lotes.length === 0) {
      setSinLotes(true);
      setRegistros([]);
      return;
    }
    setSinLotes(false);
    setRegistros(null);
    Promise.all(
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
    ).then((resultado) => {
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
      if (esPremium()) {
        for (const { lote, datos } of resultado) {
          if (datos !== "error") avisarSiVentanaAbierta(lote, datos.windows[0] ?? null);
        }
      }
    });
  }, [tipoProducto]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-8">
      <header className="shadow-extruded flex flex-col gap-1 rounded-xl bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pizarra" aria-hidden />
            <span className="text-[14px] font-bold tracking-wider text-pizarra uppercase">
              Ventana de Aplicación
            </span>
          </div>
          <BotonSesion />
        </div>
        <h1 className="mt-1 text-[32px] font-extrabold tracking-tight text-tinta">
          Ventanas de aplicación
        </h1>
        <p className="text-[18px] leading-snug text-[#444651]">
          Cuándo se puede aplicar en cada lote, en las próximas 72 h.
        </p>
      </header>

      <div
        role="group"
        aria-label="Tipo de producto"
        className="shadow-sunken grid grid-cols-2 gap-1 rounded-xl bg-[#dae2fd] p-1"
      >
        {(["sistemico", "contacto"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tipoProducto === t}
            onClick={() => setTipoProducto(t)}
            className={`min-h-11 rounded-lg text-[18px] font-bold transition-all active:scale-[0.98] ${
              tipoProducto === t ? "shadow-extruded-sm bg-white text-pizarra" : "text-tinta"
            }`}
          >
            {t === "sistemico" ? "Sistémico" : "Contacto"}
          </button>
        ))}
      </div>

      {!premium ? (
        <Paywall
          titulo="Avisos automáticos — Premium"
          descripcion="Te avisamos con una notificación apenas se abra la mejor ventana de cada lote, sin tener que entrar a revisar."
          onActivado={() => setPremium(true)}
        />
      ) : !permisoDisponible() ? null : permiso === "granted" ? (
        <p className="shadow-sunken flex items-center gap-2 rounded-xl bg-[#f2f3ff] p-3 text-[16px] font-medium text-optima">
          <span className="material-symbols-outlined text-[21px]">notifications_active</span>
          Avisos activados: te notificamos apenas se abra una ventana.
        </p>
      ) : (
        <div className="shadow-extruded flex items-center justify-between gap-3 rounded-xl bg-white p-3">
          <p className="text-[16px] text-tinta/80">
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
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="shadow-sunken h-24 animate-pulse rounded-xl bg-[#f2f3ff]" />
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {registros.map(({ lote, datos }) => (
            <li key={lote.id}>
              <Link
                href={`/lotes/${lote.id}`}
                className="shadow-extruded flex h-full items-center gap-3 rounded-xl bg-white p-3 transition-transform active:scale-[0.99]"
              >
                <MiniaturaLote lote={lote} className="shadow-sunken h-16 w-16 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[18px] font-bold tracking-tight text-tinta">
                    {lote.nombre}
                  </span>
                  <span className="block text-[15px] text-[#444651]">
                    {lote.cultivo ? `${lote.cultivo} · ` : ""}
                    {hectareas(lote.areaHa)}
                  </span>
                  {datos === "error" ? (
                    <span className="mt-1 block text-[16px] text-tinta/60">
                      Sin pronóstico ahora. Entrá al lote para reintentar.
                    </span>
                  ) : datos.windows.length === 0 ? (
                    <span className="mt-1 block text-[16px] font-medium text-bloqueo">
                      Sin ventanas de 2+ h en 72 h
                    </span>
                  ) : (
                    <span className="mt-1 block text-[16px]">
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
        <ErrorEstado
          mensaje="No pudimos traer el pronóstico de algunos lotes."
          onReintentar={consultar}
        />
      ) : null}
    </div>
  );
}
