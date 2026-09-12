"use client";

import { useEffect, useState } from "react";
import type { Suitability } from "@/lib/spray-engine";
import type { ForecastResponsePayload } from "@/lib/tipos";

const ETIQUETAS: Record<Suitability, string> = {
  optima: "Se puede pulverizar",
  aceptable: "Se puede pulverizar",
  marginal: "Al límite",
  no_recomendada: "No pulverizar",
};

const CLAY: Record<Suitability, string> = {
  optima: "clay-token--optima",
  aceptable: "clay-token--optima",
  marginal: "clay-token--marginal",
  no_recomendada: "clay-token--bloqueo",
};

const ICONO: Record<Suitability, string> = {
  optima: "check_circle",
  aceptable: "check_circle",
  marginal: "warning",
  no_recomendada: "block",
};

const COLOR_ICONO: Record<Suitability, string> = {
  optima: "text-optima",
  aceptable: "text-optima",
  marginal: "text-marginal",
  no_recomendada: "text-bloqueo",
};

/** Punto de estado actual de un lote en el listado. */
export default function EstadoPunto({ lat, lng }: { lat: number; lng: number }) {
  const [estado, setEstado] = useState<Suitability | "cargando" | "error">("cargando");

  useEffect(() => {
    let activo = true;
    fetch(`/api/forecast?lat=${lat}&lng=${lng}`)
      .then((r) => (r.ok ? (r.json() as Promise<ForecastResponsePayload>) : Promise.reject(new Error(String(r.status)))))
      .then((datos) => {
        if (!activo) return;
        const actual = datos.current ?? datos.hours[0] ?? null;
        setEstado(actual ? actual.suitability : "error");
      })
      .catch(() => {
        if (activo) setEstado("error");
      });
    return () => {
      activo = false;
    };
  }, [lat, lng]);

  if (estado === "cargando") {
    return (
      <span className="shadow-sunken h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#f2f3ff]" aria-hidden />
    );
  }
  if (estado === "error") {
    return <span className="shrink-0 text-[16px] text-tinta/60">sin datos</span>;
  }
  return (
    <span className="shadow-extruded-sm flex shrink-0 items-center gap-2 rounded-full bg-white py-1.5 pr-3.5 pl-1.5 text-[15px] font-bold text-tinta">
      <span className={`clay-token ${CLAY[estado]} h-9 w-9`} aria-hidden>
        <span
          className={`material-symbols-outlined ${COLOR_ICONO[estado]} text-[20px]`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {ICONO[estado]}
        </span>
      </span>
      {ETIQUETAS[estado]}
    </span>
  );
}
