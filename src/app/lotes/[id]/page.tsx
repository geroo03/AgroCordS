"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DetalleHora from "@/components/decision/DetalleHora";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import LineaDeTiempo from "@/components/decision/LineaDeTiempo";
import Ventanas from "@/components/decision/Ventanas";
import RegistrarAplicacion from "@/components/registro/RegistrarAplicacion";
import SelectorProducto, {
  type SeleccionProducto,
} from "@/components/registro/SelectorProducto";
import ValorEconomico from "@/components/decision/ValorEconomico";
import Cargando from "@/components/ui/Cargando";
import ErrorEstado from "@/components/ui/ErrorEstado";
import Vacio from "@/components/ui/Vacio";
import SubNavLote from "@/components/ui/SubNavLote";
import { listarAplicaciones, obtenerLote } from "@/lib/almacen";
import BotonChat from "@/components/chat/BotonChat";
import { hectareas } from "@/lib/formato";
import { kcParaCultivo } from "@/lib/cultivo";
import { estimarValorDecision } from "@/lib/riesgo";
import { evaluarHelada } from "@/lib/helada";
import Diagnostico from "@/components/sintesis/Diagnostico";
import { sintetizar, type EntradaAgua } from "@/lib/sintesis";
import { calcularIndiceAgotamiento } from "@/lib/agronomico";
import { fetchHistoricoDiario } from "@/lib/historico";
import { fechaLocalHoy } from "@/lib/formato";
import { esPremium } from "@/lib/plan";
import type { EstadoEnso } from "@/lib/enso";
import type { ObservacionSatelital } from "@/lib/satelital/tipos";
import type { ProductType } from "@/lib/spray-engine";
import type { Aplicacion, ForecastResponsePayload, Lote } from "@/lib/tipos";

export default function PaginaDecision() {
  const params = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null | "no_encontrado">(null);
  const [tipoProducto, setTipoProducto] = useState<ProductType>("sistemico");
  const [datos, setDatos] = useState<ForecastResponsePayload | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [producto, setProducto] = useState<SeleccionProducto>({
    nombre: "",
    principioId: null,
  });
  // El balance hídrico alimenta al diagnóstico. Se guarda junto al id del
  // lote que lo produjo: al abrir otro lote el dato deja de aplicar y la
  // síntesis lo informa como sin datos, en vez de mostrar el del anterior.
  // El ONI es un índice global y se publica una vez por mes: no depende del
  // lote y no hace falta volver a pedirlo al cambiar de pantalla.
  const [enso, setEnso] = useState<EstadoEnso | null>(null);
  const [vigorCargado, setVigorCargado] = useState<{
    loteId: string;
    observaciones: ObservacionSatelital[];
  } | null>(null);
  const [aguaCargada, setAguaCargada] = useState<{
    loteId: string;
    datos: EntradaAgua;
  } | null>(null);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);

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
    if (!lote || lote === "no_encontrado") return;
    let vigente = true;
    listarAplicaciones(lote.id).then((a) => {
      if (vigente) setAplicaciones(a);
    });
    return () => {
      vigente = false;
    };
  }, [lote]);

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

  useEffect(() => {
    if (!lote || lote === "no_encontrado" || !lote.fechaSiembra) return;
    const { id, centroidLat, centroidLng, fechaSiembra, cultivo: cultivoLote } = lote;
    let vigente = true;
    fetchHistoricoDiario({
      latitude: centroidLat,
      longitude: centroidLng,
      desde: fechaSiembra,
      hasta: fechaLocalHoy(),
    })
      .then((dias) => {
        if (!vigente) return;
        const kc = kcParaCultivo(cultivoLote);
        // La tendencia sale de recalcular el balance sin la última semana:
        // dos puntos de la misma serie, no una segunda consulta.
        const previos = dias.slice(0, Math.max(0, dias.length - 7));
        setAguaCargada({
          loteId: id,
          datos: {
            indiceHoy: calcularIndiceAgotamiento(dias, kc),
            indicePrevio:
              previos.length > 0 ? calcularIndiceAgotamiento(previos, kc) : null,
          },
        });
      })
      // Sin histórico no hay nada que guardar: el diagnóstico ya sabe decir
      // que falta el dato.
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [lote]);

  useEffect(() => {
    // Sólo con Premium: es la consulta que consume cuota del proveedor. Sin
    // ella la síntesis informa el vigor como sin datos y lo dice.
    if (!lote || lote === "no_encontrado") return;
    const { id, geometry } = lote;
    let vigente = true;
    esPremium().then((premium) => {
      if (!premium || !vigente) return;
      const hasta = fechaLocalHoy();
      const desde = new Date(Date.now() - 130 * 86_400_000).toISOString().slice(0, 10);
      fetch(
        `/api/satellite?polygon=${encodeURIComponent(JSON.stringify(geometry))}&from=${desde}&to=${hasta}`,
      )
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((serie: { observaciones: ObservacionSatelital[] }) => {
          if (vigente) setVigorCargado({ loteId: id, observaciones: serie.observaciones });
        })
        .catch(() => undefined);
    });
    return () => {
      vigente = false;
    };
  }, [lote]);

  useEffect(() => {
    let vigente = true;
    fetch("/api/enso")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((estado: EstadoEnso) => {
        if (vigente) setEnso(estado);
      })
      // Sin ENSO la síntesis informa la categoría como sin datos y lo explica.
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, []);

  // Todos los hooks corren antes de cualquier return: su cantidad no puede
  // cambiar entre renders.
  const datosDelRender = datos;
  const cultivo = lote && lote !== "no_encontrado" ? lote.cultivo : null;
  const vigor =
    lote && lote !== "no_encontrado" && vigorCargado?.loteId === lote.id
      ? vigorCargado.observaciones
      : null;
  const agua =
    lote && lote !== "no_encontrado" && aguaCargada?.loteId === lote.id
      ? aguaCargada.datos
      : null;
  const actualParaSintesis = datosDelRender
    ? (datosDelRender.current ?? datosDelRender.hours[0] ?? null)
    : null;
  // Memoizado: la pantalla re-renderiza ante cada cambio del selector de
  // producto o de la hora elegida, y evaluar 72 h en cada uno sería trabajo
  // repetido sobre entradas que no cambiaron.
  const diagnostico = useMemo(
    () =>
      sintetizar({
        cultivo,
        actual: actualParaSintesis,
        ventanas: datosDelRender?.windows ?? [],
        helada: datosDelRender
          ? evaluarHelada(
              datosDelRender.hours.map((h) => h.conditions),
              cultivo,
            )
          : [],
        agua,
        vigor,
        enso,
      }),
    [cultivo, actualParaSintesis, datosDelRender, agua, vigor, enso],
  );

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

  const actual = datosDelRender ? (datosDelRender.current ?? datosDelRender.hours[0] ?? null) : null;
  const seleccionada = datos
    ? (datos.hours.find((h) => h.time === horaSeleccionada) ?? actual)
    : null;
  // El asistente del lote reusa este mismo valor y el diagnóstico ya
  // calculado arriba: nunca recalcula nada por su cuenta.
  const valor = datos ? estimarValorDecision(actual, datos.windows[0] ?? null, lote.areaHa) : null;

  return (
    <div className="px-5 pb-24">
      <header className="pt-3 pb-4">
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
        <div className="mt-3">
          <SubNavLote loteId={lote.id} />
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
          <Diagnostico diagnostico={diagnostico} />
          <ValorEconomico valor={valor} />

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
              productoNombre={producto.nombre}
            />
          </div>

          <BotonChat
            lote={{ nombre: lote.nombre, cultivo: lote.cultivo, areaHa: lote.areaHa }}
            diagnostico={diagnostico}
            valor={valor}
            aplicaciones={aplicaciones}
          />
        </>
      )}

      <footer className="clay-hundido fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-[480px] px-5 py-2 text-[11px] leading-snug text-tinta/70 backdrop-blur">
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
