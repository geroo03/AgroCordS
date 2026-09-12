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
import SubNavLote from "@/components/ui/SubNavLote";
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
      <div className="px-4 py-8">
        <Vacio>Este lote no existe en este dispositivo.</Vacio>
        <Link href="/lotes" className="mt-4 block font-semibold text-pizarra underline">
          Volver a tus lotes
        </Link>
      </div>
    );
  }

  if (!lote) {
    return (
      <div className="px-4">
        <Cargando />
      </div>
    );
  }

  const actual = datos ? (datos.current ?? datos.hours[0] ?? null) : null;
  const seleccionada = datos
    ? (datos.hours.find((h) => h.time === horaSeleccionada) ?? actual)
    : null;

  return (
    <div className="flex flex-col gap-5 px-4 pt-3 pb-16">
      <header className="sticky top-0 z-30 -mx-4 flex flex-col gap-2 bg-fondo/95 px-4 pt-2 pb-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link
            href="/lotes"
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

      {error && !datos ? (
        <ErrorEstado mensaje={error} onReintentar={consultar} />
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

          {error ? <ErrorEstado mensaje={error} onReintentar={consultar} /> : null}

          <div className={`flex flex-col gap-5 ${cargando ? "opacity-60" : ""}`}>
            <LineaDeTiempo
              horas={datos.hours}
              seleccionada={seleccionada?.time ?? null}
              ahora={datos.current?.time ?? null}
              onSeleccionar={setHoraSeleccionada}
            />

            {seleccionada ? (
              <div className="shadow-extruded rounded-xl bg-white p-4">
                <DetalleHora hora={seleccionada} />
              </div>
            ) : null}

            <div className="shadow-extruded rounded-xl bg-white p-4">
              <Ventanas ventanas={datos.windows} onElegir={setHoraSeleccionada} />
            </div>

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

      <footer className="shadow-sunken flex items-start gap-2 rounded-lg bg-[#f2f3ff] px-3 py-2 text-[13px] leading-snug text-[#444651]">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#757682]">
          policy
        </span>
        <p>
          Esta app informa condiciones meteorológicas y no reemplaza la receta fitosanitaria
          de un profesional matriculado. Datos meteorológicos de{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open-Meteo.com
          </a>{" "}
          (CC BY 4.0).
        </p>
      </footer>
    </div>
  );
}
