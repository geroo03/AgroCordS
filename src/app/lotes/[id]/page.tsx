"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DetalleHora from "@/components/decision/DetalleHora";
import LineaDeTiempo from "@/components/decision/LineaDeTiempo";
import Ventanas from "@/components/decision/Ventanas";
import Veredicto from "@/components/decision/Veredicto";
import RegistrarAplicacion from "@/components/registro/RegistrarAplicacion";
import Cargando from "@/components/ui/Cargando";
import ErrorEstado from "@/components/ui/ErrorEstado";
import Vacio from "@/components/ui/Vacio";
import { obtenerLote } from "@/lib/almacen";
import { hectareas } from "@/lib/formato";
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
    <div className="px-5 pb-28">
      <header className="flex items-center justify-between gap-2 border-b border-niebla py-3">
        <Link
          href="/lotes"
          className="flex min-h-11 items-center gap-2 font-semibold text-pizarra"
        >
          <span aria-hidden>←</span>
          <span>
            {lote.nombre} · {hectareas(lote.areaHa)}
          </span>
        </Link>
        <Link
          href={`/lotes/${lote.id}/historial`}
          className="flex min-h-11 shrink-0 items-center text-sm font-semibold text-pizarra underline"
        >
          Historial
        </Link>
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

          <div
            role="group"
            aria-label="Tipo de producto"
            className="grid grid-cols-2 gap-1 rounded-xl bg-niebla p-1"
          >
            {(["sistemico", "contacto"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tipoProducto === t}
                onClick={() => setTipoProducto(t)}
                className={`min-h-11 rounded-lg text-base font-semibold transition-colors duration-200 ${
                  tipoProducto === t ? "bg-pizarra text-white" : "text-tinta"
                }`}
              >
                {t === "sistemico" ? "Sistémico" : "Contacto"}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-tinta/60">
            Un producto de contacto necesita más horas sin lluvia: la misma hora puede
            cambiar de estado al cambiar el tipo.
          </p>

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
            />
          </div>
        </>
      )}

      <footer className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] border-t border-niebla bg-papel/95 px-5 py-2 text-[11px] leading-snug text-tinta/70 backdrop-blur">
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
