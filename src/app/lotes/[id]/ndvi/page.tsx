"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DetalleLectura from "@/components/ndvi/DetalleLectura";
import EstadoVigor from "@/components/ndvi/EstadoVigor";
import FuenteDatos from "@/components/ndvi/FuenteDatos";
import SerieNdvi from "@/components/ndvi/SerieNdvi";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import ErrorEstado from "@/components/ui/ErrorEstado";
import Paywall from "@/components/ui/Paywall";
import SubNavLote from "@/components/ui/SubNavLote";
import Vacio from "@/components/ui/Vacio";
import { obtenerLote } from "@/lib/almacen";
import { hectareas } from "@/lib/formato";
import { ultimaLectura } from "@/lib/ndvi";
import { esPremium } from "@/lib/plan";
import type { SerieSatelital } from "@/lib/satelital/tipos";
import type { Lote } from "@/lib/tipos";

/** Ventana consultada. Sentinel-2 devuelve sólo las fechas con pasada. */
const VENTANA_DIAS = 130;
/** Mayor que los timeouts del servidor: si el proveedor no responde, es el
 * servidor quien cae al fallback y responde; este límite es sólo un cinturón. */
const TIMEOUT_CLIENTE_MS = 30_000;

function rangoFechas(): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - VENTANA_DIAS * 86_400_000);
  const aIso = (d: Date) => d.toISOString().slice(0, 10);
  return { desde: aIso(desde), hasta: aIso(hasta) };
}

export default function PaginaNdvi() {
  const params = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null | "no_encontrado">(null);
  const [serie, setSerie] = useState<SerieSatelital | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    setLote(obtenerLote(params.id) ?? "no_encontrado");
    setPremium(esPremium());
  }, [params.id]);

  const consultar = useCallback(() => {
    if (!lote || lote === "no_encontrado" || !premium) return;
    setCargando(true);
    setError(null);
    const { desde, hasta } = rangoFechas();
    // Se envía el polígono completo del lote, no el centroide: el promedio se
    // calcula sobre toda la superficie.
    const url = `/api/satellite?polygon=${encodeURIComponent(
      JSON.stringify(lote.geometry),
    )}&from=${desde}&to=${hasta}`;

    fetch(url, { signal: AbortSignal.timeout(TIMEOUT_CLIENTE_MS) })
      .then((r) =>
        r.ok ? (r.json() as Promise<SerieSatelital>) : Promise.reject(new Error(String(r.status))),
      )
      .then((datos) => {
        setSerie(datos);
        const ultima = ultimaLectura(datos.observaciones);
        setFechaSeleccionada((previa) => previa ?? ultima?.fecha ?? null);
      })
      .catch(() => setError("No pudimos obtener datos satelitales."))
      .finally(() => setCargando(false));
  }, [lote, premium]);

  useEffect(() => {
    consultar();
  }, [consultar]);

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

  const seleccionada = serie
    ? (serie.observaciones.find((l) => l.fecha === fechaSeleccionada) ??
      ultimaLectura(serie.observaciones))
    : null;

  return (
    <div className="flex flex-col gap-5 px-4 pt-3 pb-8">
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

      <div className="shadow-extruded rounded-xl bg-white p-5">
        <h1 className="text-[32px] font-extrabold tracking-tight text-tinta">Vigor vegetativo</h1>
      </div>

      {!premium ? (
        <Paywall
          titulo="Vigor satelital — Premium"
          descripcion="NDVI y NDRE reales desde Sentinel-2 sobre el polígono de este lote, con fecha de observación y cobertura de nubes."
          onActivado={() => setPremium(true)}
        />
      ) : /* Sólo este módulo muestra carga: el encabezado y la navegación siguen usables. */
      cargando && !serie ? (
        <div className="space-y-3" aria-busy="true">
          <p className="text-[16px] font-semibold text-tinta/60">Consultando Sentinel-2…</p>
          <div className="shadow-sunken h-16 animate-pulse rounded-xl bg-[#f2f3ff]" />
          <div className="shadow-sunken h-24 animate-pulse rounded-xl bg-[#f2f3ff]" />
          <div className="shadow-sunken h-32 animate-pulse rounded-xl bg-[#f2f3ff]" />
        </div>
      ) : error && !serie ? (
        <ErrorEstado mensaje={error} onReintentar={consultar} />
      ) : serie ? (
        <div className={cargando ? "opacity-60" : ""}>
          <div className="mt-4">
            <FuenteDatos serie={serie} ultima={ultimaLectura(serie.observaciones)} />
          </div>

          {serie.observaciones.length === 0 ? (
            <div className="mt-4">
              <Vacio>
                Sentinel-2 no tuvo pasadas útiles sobre este lote en los últimos{" "}
                {VENTANA_DIAS} días (nubosidad por encima del umbral o sin cobertura).
                No se muestran valores inventados: volvé a consultar en unos días.
              </Vacio>
            </div>
          ) : (
            <>
              <EstadoVigor lectura={seleccionada} />

              <SerieNdvi
                serie={serie.observaciones}
                seleccionada={seleccionada?.fecha ?? null}
                onSeleccionar={setFechaSeleccionada}
              />

              {seleccionada ? (
                <div className="mt-6">
                  <DetalleLectura lectura={seleccionada} />
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <p className="mt-8 text-[16px] leading-relaxed text-tinta/70">
        <strong>NDVI</strong> resume la biomasa fotosintética activa del lote: es el
        indicador de referencia para vigor temprano, pero se satura cuando el canopeo
        ya cubrió el suelo. <strong>NDRE</strong> usa la banda de borde rojo en vez de
        rojo: no se satura tan rápido y es más sensible a clorofila y nitrógeno en
        etapas avanzadas, cuando NDVI ya no distingue variación dentro del lote. El
        vigor no interviene en la decisión de pulverización: son módulos separados.
      </p>
    </div>
  );
}
