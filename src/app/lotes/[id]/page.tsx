"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DetalleHora from "@/components/decision/DetalleHora";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import LineaDeTiempo from "@/components/decision/LineaDeTiempo";
import Ventanas from "@/components/decision/Ventanas";
import Veredicto from "@/components/decision/Veredicto";
import RegistrarAplicacion from "@/components/registro/RegistrarAplicacion";
import SelectorProducto, {
  type SeleccionProducto,
} from "@/components/registro/SelectorProducto";
import ValorEconomico from "@/components/decision/ValorEconomico";
import Cargando from "@/components/ui/Cargando";
import ErrorEstado from "@/components/ui/ErrorEstado";
import Vacio from "@/components/ui/Vacio";
import { obtenerLote } from "@/lib/almacen";
import { hectareas } from "@/lib/formato";
import { obtenerPrincipio } from "@/lib/productos";
import { estimarValorDecision } from "@/lib/riesgo";
import type { ProductType } from "@/lib/spray-engine";
import type { ForecastResponsePayload, Lote } from "@/lib/tipos";

export default function PaginaDecision() {
  const params = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null | "no_encontrado">(null);
  const [tipoProducto, setTipoProducto] = useState<ProductType>("sistemico");
  const [datos, setDatos] = useState<ForecastResponsePayload | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [producto, setProducto] = useState<SeleccionProducto>({
    principioId: null,
    comercial: null,
  });

  useEffect(() => {
    setLote(obtenerLote(params.id) ?? "no_encontrado");
  }, [params.id]);

  const consultar = useCallback(() => {
    if (!lote || lote === "no_encontrado") return;
    setCargando(true);
    setError(null);
    fetch(
      `/api/forecast?lat=${lote.centroidLat}&lng=${lote.centroidLng}&productType=${tipoProducto}`,
    )
      .then((r) =>
        r.ok
          ? (r.json() as Promise<ForecastResponsePayload>)
          : Promise.reject(new Error(String(r.status))),
      )
      .then((payload) => {
        setDatos(payload);
        const actual = payload.current ?? payload.hours[0] ?? null;
        setHoraSeleccionada((previa) => previa ?? actual?.time ?? null);
      })
      .catch(() => setError("No pudimos traer el pronóstico para este lote."))
      .finally(() => setCargando(false));
  }, [lote, tipoProducto]);

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
      <div className="px-5">
        <Cargando />
      </div>
    );
  }

  const actual = datos ? (datos.current ?? datos.hours[0] ?? null) : null;
  const seleccionada = datos
    ? (datos.hours.find((h) => h.time === horaSeleccionada) ?? actual)
    : null;

  return (
    <div className="px-5 pb-24">
      <header className="flex items-center justify-between gap-2 border-b border-niebla py-3">
        <Link
          href="/lotes"
          className="flex min-h-11 min-w-0 items-center gap-2 font-semibold text-pizarra"
        >
          <span aria-hidden>←</span>
          <MiniaturaLote lote={lote} className="h-9 w-9" />
          <span className="truncate">
            {lote.nombre} · {hectareas(lote.areaHa)}
          </span>
        </Link>
        <div className="flex min-h-11 shrink-0 items-center gap-2.5 text-sm font-semibold text-pizarra">
          <Link href={`/lotes/${lote.id}/ndvi`} className="underline">
            NDVI
          </Link>
          <Link href={`/lotes/${lote.id}/riesgo`} className="underline">
            Riesgo
          </Link>
          <Link href={`/lotes/${lote.id}/historial`} className="underline">
            Historial
          </Link>
        </div>
      </header>

      {error && !datos ? (
        <div className="py-8">
          <ErrorEstado mensaje={error} onReintentar={consultar} />
        </div>
      ) : !datos ? (
        <Cargando />
      ) : (
        <>
          <Veredicto actual={actual} esAhora={datos.current !== null} />
          <ValorEconomico
            valor={estimarValorDecision(actual, datos.windows[0] ?? null, lote.areaHa)}
          />

          <SelectorProducto
            tipo={tipoProducto}
            onTipo={setTipoProducto}
            seleccion={producto}
            onSeleccion={setProducto}
          />

          {error ? (
            <div className="mt-4">
              <ErrorEstado mensaje={error} onReintentar={consultar} />
            </div>
          ) : null}

          <div className={`mt-6 space-y-8 ${cargando ? "opacity-60" : ""}`}>
            <LineaDeTiempo
              horas={datos.hours}
              seleccionada={seleccionada?.time ?? null}
              ahora={datos.current?.time ?? null}
              onSeleccionar={setHoraSeleccionada}
            />

            {seleccionada ? <DetalleHora hora={seleccionada} /> : null}

            <Ventanas ventanas={datos.windows} onElegir={setHoraSeleccionada} />

            <RegistrarAplicacion
              loteId={lote.id}
              tipoProducto={tipoProducto}
              condiciones={actual}
              productoSugerido={
                producto.principioId
                  ? producto.comercial
                    ? `${producto.comercial} (${obtenerPrincipio(producto.principioId)?.nombre})`
                    : (obtenerPrincipio(producto.principioId)?.nombre ?? null)
                  : null
              }
            />
          </div>
        </>
      )}

      <footer className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-[480px] border-t border-niebla bg-papel/95 px-5 py-2 text-[11px] leading-snug text-tinta/70 backdrop-blur">
        Esta app informa condiciones meteorológicas y no reemplaza la receta
        fitosanitaria de un profesional matriculado. Datos meteorológicos de{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Open-Meteo.com
        </a>{" "}
        (CC BY 4.0).
      </footer>
    </div>
  );
}
