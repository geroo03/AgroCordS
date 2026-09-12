"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import Cargando from "@/components/ui/Cargando";
import ErrorEstado from "@/components/ui/ErrorEstado";
import Vacio from "@/components/ui/Vacio";
import {
  AGUA_UTIL_MAX_MM,
  calcularGddAcumulado,
  calcularIndiceAgotamiento,
} from "@/lib/agronomico";
import { fetchHistoricoDiario } from "@/lib/historico";
import { obtenerLote } from "@/lib/almacen";
import { kcParaCultivo } from "@/lib/cultivo";
import { fechaLocalHoy, hectareas } from "@/lib/formato";
import type { Lote } from "@/lib/tipos";

export default function PaginaAgronomica() {
  const params = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null | "no_encontrado">(null);
  const [gdd, setGdd] = useState<number | null>(null);
  const [agotamiento, setAgotamiento] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerLote(params.id).then((l) => {
      if (vigente) setLote(l ?? "no_encontrado");
    });
    return () => {
      vigente = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!lote || lote === "no_encontrado" || !lote.fechaSiembra) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    fetchHistoricoDiario({
      latitude: lote.centroidLat,
      longitude: lote.centroidLng,
      desde: lote.fechaSiembra,
      hasta: fechaLocalHoy(),
    })
      .then((dias) => {
        setGdd(calcularGddAcumulado(dias, lote.cultivo));
        setAgotamiento(calcularIndiceAgotamiento(dias, kcParaCultivo(lote.cultivo)));
      })
      .catch(() => setError("No pudimos traer el histórico de este lote."))
      .finally(() => setCargando(false));
  }, [lote]);

  if (lote === "no_encontrado") {
    return (
      <div className="px-5 py-8">
        <Vacio>Este lote no existe en este dispositivo.</Vacio>
        <Link href="/lotes" className="mt-4 block font-semibold underline">
          Volver a tus lotes
        </Link>
      </div>
    );
  }
  if (!lote) return <Cargando />;

  return (
    <div className="px-5 pt-5 pb-24">
      <header className="clay-elevado flex flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/lotes/${lote.id}`} className="flex min-h-11 min-w-0 items-center gap-2 font-semibold text-pizarra">
            <span aria-hidden>←</span>
            <MiniaturaLote lote={lote} className="h-9 w-9" />
            <span className="truncate">{lote.nombre} · {hectareas(lote.areaHa)}</span>
          </Link>
          <Link href={`/lotes/${lote.id}`} className="shrink-0 text-sm font-semibold text-pizarra underline">
            Volver
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-tinta">Balance agronómico</h1>
          <p className="mt-1 text-base text-tinta/70">
            Acumulado desde el {lote.fechaSiembra ?? "inicio"} con datos históricos de Open-Meteo.
          </p>
        </div>
      </header>

      <main className="space-y-5 py-6">
        {!lote.fechaSiembra ? (
          <>
            <Vacio>
              Este lote no tiene fecha de siembra. Cargala para calcular grados día y agotamiento hídrico.
            </Vacio>
            <Link href="/lotes" className="block font-semibold text-pizarra underline">
              Ir al alta de lote
            </Link>
          </>
        ) : cargando ? (
          <Cargando />
        ) : error ? (
          <ErrorEstado mensaje={error} onReintentar={() => window.location.reload()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="clay-elevado rounded-2xl p-4">
              <p className="text-sm font-semibold text-tinta/70">Grados día acumulados</p>
              <p className="mt-2 text-4xl font-extrabold text-tinta">{gdd?.toFixed(1) ?? "-"}</p>
              <p className="mt-2 text-sm text-tinta/70">Método modificado con techo por cultivo.</p>
            </section>
            <section className="clay-elevado rounded-2xl p-4">
              <p className="text-sm font-semibold text-tinta/70">Índice de agotamiento</p>
              <p className="mt-2 text-4xl font-extrabold text-tinta">{agotamiento?.toFixed(2) ?? "-"}</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-niebla">
                <div className="h-full bg-pizarra" style={{ width: `${(agotamiento ?? 0) * 100}%` }} />
              </div>
              <p className="mt-2 text-sm text-tinta/70">0 = suelo lleno; 1 = agotado.</p>
            </section>
            <p className="text-sm text-tinta/70 sm:col-span-2">
              Supuesto: reserva inicial de {AGUA_UTIL_MAX_MM} mm de agua útil a capacidad de campo. El Kc es una aproximación fija de la etapa de mayor demanda.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}