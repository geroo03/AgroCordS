"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import ScoreManejo from "@/components/riesgo/ScoreManejo";
import Paywall from "@/components/ui/Paywall";
import SubNavLote from "@/components/ui/SubNavLote";
import Vacio from "@/components/ui/Vacio";
import { listarAplicaciones, obtenerLote } from "@/lib/almacen";
import { hectareas } from "@/lib/formato";
import { esPremium } from "@/lib/plan";
import { calcularScoreManejo } from "@/lib/riesgo";
import type { ObservacionSatelital, SerieSatelital } from "@/lib/satelital/tipos";
import type { Aplicacion, Lote } from "@/lib/tipos";

/** Misma ventana que consulta la pantalla de NDVI. */
const VENTANA_DIAS = 130;
const TIMEOUT_CLIENTE_MS = 30_000;

function rangoFechas(): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - VENTANA_DIAS * 86_400_000);
  const aIso = (d: Date) => d.toISOString().slice(0, 10);
  return { desde: aIso(desde), hasta: aIso(hasta) };
}

export default function PaginaRiesgo() {
  const params = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null | "no_encontrado">(null);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [observaciones, setObservaciones] = useState<ObservacionSatelital[]>([]);
  const [cargandoVigor, setCargandoVigor] = useState(true);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    const encontrado = obtenerLote(params.id) ?? "no_encontrado";
    setLote(encontrado);
    if (encontrado !== "no_encontrado") setAplicaciones(listarAplicaciones(encontrado.id));
    setPremium(esPremium());
  }, [params.id]);

  useEffect(() => {
    if (!lote || lote === "no_encontrado" || !premium) return;
    const { desde, hasta } = rangoFechas();
    const url = `/api/satellite?polygon=${encodeURIComponent(
      JSON.stringify(lote.geometry),
    )}&from=${desde}&to=${hasta}`;

    setCargandoVigor(true);
    fetch(url, { signal: AbortSignal.timeout(TIMEOUT_CLIENTE_MS) })
      .then((r) =>
        r.ok ? (r.json() as Promise<SerieSatelital>) : Promise.reject(new Error(String(r.status))),
      )
      .then((datos) => setObservaciones(datos.observaciones as ObservacionSatelital[]))
      // Sin vigor disponible, el score sigue armándose con las aplicaciones.
      .catch(() => setObservaciones([]))
      .finally(() => setCargandoVigor(false));
  }, [lote, premium]);

  if (lote === "no_encontrado") {
    return (
      <div className="px-5 py-8">
        <Vacio>Este lote no existe en este dispositivo.</Vacio>
        <Link href="/lotes" className="mt-4 block font-semibold text-pizarra underline">
          Volver a tus lotes
        </Link>
      </div>
    );
  }

  if (!lote) {
    return (
      <div className="px-4 py-8">
        <div className="shadow-sunken h-40 animate-pulse rounded-xl bg-[#f2f3ff]" />
      </div>
    );
  }

  const resultado = calcularScoreManejo(aplicaciones, observaciones);

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-8">
      <header className="sticky top-0 z-30 -mx-4 flex flex-col gap-2 bg-fondo/95 px-4 pt-2 pb-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link
            href={`/lotes/${lote.id}`}
            className="shadow-extruded-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaedff] text-pizarra active:scale-95"
          >
            <span className="material-symbols-outlined text-[25px]">arrow_back</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <MiniaturaLote lote={lote} className="shadow-sunken h-9 w-9 rounded-lg" />
            <span className="truncate text-[17px] font-bold tracking-tight text-tinta">
              {lote.nombre} · {hectareas(lote.areaHa)}
            </span>
          </div>
        </div>
        <SubNavLote loteId={lote.id} />
      </header>

      <div className="shadow-extruded flex flex-col gap-1 rounded-xl bg-white p-5">
        <h1 className="text-[32px] font-extrabold tracking-tight text-tinta">Score de manejo</h1>
        <p className="text-[18px] leading-snug text-[#444651]">
          Un índice de buenas prácticas a partir de tu historial de aplicaciones y del
          vigor del lote — el tipo de dato que un seguro paramétrico o una línea de
          crédito agro usaría para tarificar riesgo.
        </p>
      </div>

      {!premium ? (
        <Paywall
          titulo="Score de manejo — Premium"
          descripcion="Un reporte de buenas prácticas para presentar ante tu seguro o tu línea de crédito agro."
          onActivado={() => setPremium(true)}
        />
      ) : (
        <>
          <p className="shadow-sunken rounded-lg bg-[#f2f3ff] p-2 text-[14px] text-[#444651]">
            <strong className="text-tinta">Metodología ilustrativa</strong>, no un modelo
            actuarial validado. Pensado como insumo para una futura integración con
            seguros o financiamiento agro, no como una calificación crediticia ya operativa.
          </p>

          <div>
            {cargandoVigor && observaciones.length === 0 ? (
              <div className="space-y-3" aria-busy="true">
                <div className="shadow-sunken h-16 w-24 animate-pulse rounded-lg bg-[#f2f3ff]" />
                <div className="shadow-sunken h-24 animate-pulse rounded-xl bg-[#f2f3ff]" />
              </div>
            ) : (
              <ScoreManejo resultado={resultado} />
            )}
          </div>

          <p className="mt-8 text-[16px] leading-relaxed text-tinta/70">
            El score no interviene en la decisión de pulverización: son módulos
            separados. Combina la fracción de aplicaciones registradas en buenas
            condiciones (dato congelado en cada aplicación, no recalculado) con la
            estabilidad del vigor vegetativo real medido por satélite.
          </p>
        </>
      )}
    </div>
  );
}
