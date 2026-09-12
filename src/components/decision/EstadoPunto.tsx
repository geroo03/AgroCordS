"use client";

import { useEffect, useState } from "react";
import type { Suitability } from "@/lib/spray-engine";
import type { ForecastResponsePayload } from "@/lib/tipos";

const ETIQUETAS: Record<Suitability, string> = {
  optima: "Favorable",
  aceptable: "Favorable",
  marginal: "Al límite",
  no_recomendada: "No favorable",
};

const COLORES: Record<Suitability, string> = {
  optima: "bg-optima",
  aceptable: "bg-aceptable",
  marginal: "bg-marginal",
  no_recomendada: "bg-bloqueo",
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
    return <span className="h-3 w-3 animate-pulse rounded-full bg-niebla" aria-hidden />;
  }
  if (estado === "error") {
    return <span className="text-sm text-tinta/60">sin datos</span>;
  }
  return (
    <span className="flex items-center gap-2 text-sm font-semibold">
      <span className={`h-3 w-3 rounded-full ${COLORES[estado]}`} aria-hidden />
      {ETIQUETAS[estado]}
    </span>
  );
}
