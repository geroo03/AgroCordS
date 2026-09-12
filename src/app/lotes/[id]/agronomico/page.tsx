"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import Cargando from "@/components/ui/Cargando";
import ErrorEstado from "@/components/ui/ErrorEstado";
import Vacio from "@/components/ui/Vacio";
import {
  calcularGddAcumulado,
  calcularIndiceAgotamiento,
} from "@/lib/agronomico";
import { fetchHistoricoDiario } from "@/lib/historico";
import { obtenerLote } from "@/lib/almacen";
import { hectareas } from "@/lib/formato";
import type { Lote } from "@/lib/tipos";

function kcParaCultivo(cultivo: string | null): number {
  const normalizado = cultivo
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return normalizado === "trigo" ? 0.95 : normalizado === "maiz" ? 1 : 0.8;
}

export default function PaginaAgronomica() {
  const params = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null | "no_encontrado">(null);
  const [gdd, setGdd] = useState<number | null>(null);
  const [agotamiento, setAgotamiento] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLote(obtenerLote(params.id) ?? "no_encontrado");
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
      hasta: new Date().toISOString().slice(0, 10),
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
    <div className="px-5 pb-24">
      <header className="flex items-center justify-between gap-2 border-b border-niebla py-3">
        <Link href={`/lotes/${lote.id}`} className="flex min-h-11 min-w-0 items-center gap-2 font-semibold text-pizarra">
          <span aria-hidden>←</span>
          <MiniaturaLote lote={lote} className="h-9 w-9" />
          <span className="truncate">{lote.nombre} · {hectareas(lote.areaHa)}</span>
        </Link>
        <Link href={`/lotes/${lote.id}`} className="shrink-0 text-sm font-semibold underline">
          Volver
        </Link>
      </header>

      <main className="space-y-5 py-6">
        <div>
          <h1 className="text-2xl font-extrabold">Balance agronómico</h1>
          <p className="mt-1 text-base text-tinta/70">
            Acumulado desde el {lote.fechaSiembra ?? "inicio"} con datos históricos de Open-Meteo.
          </p>
        </div>

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
            <section className="rounded-xl border border-niebla p-4">
              <p className="text-sm font-semibold text-tinta/70">Grados día acumulados</p>
              <p className="mt-2 text-4xl font-extrabold">{gdd?.toFixed(1) ?? "-"}</p>
              <p className="mt-2 text-sm text-tinta/70">Método modificado con techo por cultivo.</p>
            </section>
            <section className="rounded-xl border border-niebla p-4">
              <p className="text-sm font-semibold text-tinta/70">Índice de agotamiento</p>
              <p className="mt-2 text-4xl font-extrabold">{agotamiento?.toFixed(2) ?? "-"}</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-niebla">
                <div className="h-full bg-pizarra" style={{ width: `${(agotamiento ?? 0) * 100}%` }} />
              </div>
              <p className="mt-2 text-sm text-tinta/70">0 = suelo lleno; 1 = agotado.</p>
            </section>
            <p className="text-sm text-tinta/70 sm:col-span-2">
              Supuesto: reserva inicial de {175} mm de agua útil a capacidad de campo. El Kc es una aproximación fija de la etapa de mayor demanda.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}