"use client";

import type { ObservacionSatelital } from "@/lib/satelital/tipos";

interface Props {
  serie: readonly ObservacionSatelital[];
  seleccionada: string | null;
  onSeleccionar: (fecha: string) => void;
}

const ANCHO = 320;
const ALTO = 130;
const MARGEN = 8;

function posicion(indice: number, total: number, valor: number): [number, number] {
  const x =
    total > 1 ? (indice / (total - 1)) * (ANCHO - MARGEN * 2) + MARGEN : ANCHO / 2;
  const y = ALTO - MARGEN - valor * (ALTO - MARGEN * 2);
  return [x, y];
}

/**
 * Uno o más subtrazos: la línea se CORTA en cada observación sin dato
 * confiable (`null`) en vez de interpolar por encima de la nube.
 */
function trazos(serie: readonly ObservacionSatelital[], campo: "ndvi" | "ndre"): string[] {
  const resultado: string[] = [];
  let actual = "";
  serie.forEach((l, i) => {
    const valor = l[campo];
    if (valor === null) {
      if (actual) resultado.push(actual);
      actual = "";
      return;
    }
    const [x, y] = posicion(i, serie.length, valor);
    const punto = `${x.toFixed(1)},${y.toFixed(1)}`;
    actual += actual ? ` L${punto}` : `M${punto}`;
  });
  if (actual) resultado.push(actual);
  return resultado;
}

function fechaCorta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/**
 * Serie de NDVI/NDRE por fecha de observación. El color de línea distingue
 * el índice (identidad, no estado); la clasificación de vigor vive en
 * `EstadoVigor` y `DetalleLectura`, siempre con la palabra al lado del color.
 * Las fechas de abajo son botones reales: tocar una selecciona esa
 * observación, igual que la línea de tiempo horaria.
 */
export default function SerieNdvi({ serie, seleccionada, onSeleccionar }: Props) {
  if (serie.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold">Observaciones disponibles</h2>
      <p className="mt-1 text-xs text-tinta/60">
        Una por pasada del satélite: las fechas no son equidistantes y las nubladas
        se muestran sin valor.
      </p>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="mt-2 w-full"
        role="img"
        aria-label="Serie de NDVI y NDRE por fecha de observación satelital"
      >
        {[0.35, 0.6].map((umbral) => {
          const y = ALTO - MARGEN - umbral * (ALTO - MARGEN * 2);
          return (
            <line
              key={umbral}
              x1={MARGEN}
              x2={ANCHO - MARGEN}
              y1={y}
              y2={y}
              stroke="var(--color-niebla)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          );
        })}

        {trazos(serie, "ndvi").map((d, i) => (
          <path
            key={`ndvi-${i}`}
            d={d}
            fill="none"
            stroke="var(--color-ndvi)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {trazos(serie, "ndre").map((d, i) => (
          <path
            key={`ndre-${i}`}
            d={d}
            fill="none"
            stroke="var(--color-ndre)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {serie.map((l, i) => {
          const activa = l.fecha === seleccionada;
          const puntos: { valor: number | null; color: string }[] = [
            { valor: l.ndvi, color: "var(--color-ndvi)" },
            { valor: l.ndre, color: "var(--color-ndre)" },
          ];
          return (
            <g key={l.fecha}>
              {puntos.map(({ valor, color }, k) => {
                if (valor === null) return null;
                const [x, y] = posicion(i, serie.length, valor);
                return (
                  <circle
                    key={k}
                    cx={x}
                    cy={y}
                    r={activa ? 4.5 : 2.5}
                    fill={color}
                    stroke={activa ? "var(--color-papel)" : "none"}
                    strokeWidth={activa ? 2 : 0}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex gap-4 text-xs text-tinta/70">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ndvi" aria-hidden />
          NDVI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ndre" aria-hidden />
          NDRE
        </span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {serie.map((l) => {
          const sinDato = l.ndvi === null;
          const etiqueta = sinDato
            ? `${l.fecha}: sin dato confiable, nublado`
            : `${l.fecha}: NDVI ${l.ndvi?.toFixed(2)}, NDRE ${
                l.ndre !== null ? l.ndre.toFixed(2) : "sin dato"
              }`;
          return (
            <button
              key={l.fecha}
              type="button"
              onClick={() => onSeleccionar(l.fecha)}
              aria-pressed={l.fecha === seleccionada}
              aria-label={etiqueta}
              className={`min-h-11 shrink-0 rounded-lg border px-3 text-sm font-semibold tabular-nums transition-colors duration-200 ${
                l.fecha === seleccionada
                  ? "border-pizarra bg-pizarra text-white"
                  : sinDato
                    ? "border-dashed border-niebla text-tinta/45"
                    : "border-niebla text-tinta"
              }`}
            >
              {fechaCorta(l.fecha)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
