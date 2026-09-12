"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import ScoreManejo from "@/components/riesgo/ScoreManejo";
import Paywall from "@/components/ui/Paywall";
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
    let vigente = true;
    obtenerLote(params.id).then((encontrado) => {
      if (!vigente) return;
      const resuelto = encontrado ?? "no_encontrado";
      setLote(resuelto);
      if (resuelto !== "no_encontrado") {
        listarAplicaciones(resuelto.id).then((a) => {
          if (vigente) setAplicaciones(a);
        });
      }
    });
    esPremium().then((p) => {
      if (vigente) setPremium(p);
    });
    return () => {
      vigente = false;
    };
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
      <div className="px-5 py-8">
        <div className="clay-hundido h-40 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const resultado = calcularScoreManejo(aplicaciones, observaciones);

  return (
    <div className="px-5 pt-5 pb-24">
      <header className="clay-elevado flex flex-col gap-4 rounded-2xl p-5">
        <Link
          href={`/lotes/${lote.id}`}
          className="flex min-h-11 min-w-0 items-center gap-2 font-semibold text-pizarra"
        >
          <span aria-hidden>←</span>
          <MiniaturaLote lote={lote} className="h-9 w-9" />
          <span className="truncate">
            {lote.nombre} · {hectareas(lote.areaHa)}
          </span>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-tinta">
            Score de manejo
          </h1>
          <p className="mt-1 text-sm text-tinta/70">
            Un índice de buenas prácticas a partir de tu historial de aplicaciones y del
            vigor del lote — el tipo de dato que un seguro paramétrico o una línea de
            crédito agro usaría para tarificar riesgo.
          </p>
        </div>
      </header>

      {!premium ? (
        <div className="mt-4">
          <Paywall
            titulo="Score de manejo — Premium"
            descripcion="Un reporte de buenas prácticas para presentar ante tu seguro o tu línea de crédito agro."
            onActivado={() => setPremium(true)}
          />
        </div>
      ) : (
        <>
          <p className="clay-hundido mt-4 rounded-xl p-3 text-xs text-tinta/70">
            <strong>Metodología ilustrativa</strong>, no un modelo actuarial validado.
            Pensado como insumo para una futura integración con seguros o
            financiamiento agro, no como una calificación crediticia ya operativa.
          </p>

          <div className="mt-5">
            {cargandoVigor && observaciones.length === 0 ? (
              <div className="space-y-3" aria-busy="true">
                <div className="clay-hundido h-16 w-24 animate-pulse rounded-xl" />
                <div className="clay-hundido h-24 animate-pulse rounded-2xl" />
              </div>
            ) : (
              <ScoreManejo resultado={resultado} />
            )}
          </div>

          <p className="mt-8 text-sm leading-relaxed text-tinta/70">
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
