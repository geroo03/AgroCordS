import type { Suitability } from "./spray-engine";

export const ETIQUETA_ESTADO: Record<Suitability, string> = {
  optima: "Óptima",
  aceptable: "Aceptable",
  marginal: "Marginal",
  no_recomendada: "No recomendada",
};

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** '2026-09-11T15:00' → '15:00'. No convierte a Date: la hora es local del lote. */
export function horaCorta(isoLocal: string): string {
  return isoLocal.slice(11, 16);
}

/** 'YYYY-MM-DD' → 'Hoy' | 'Mañana' | 'sábado 13 sep'. */
export function etiquetaDia(fecha: string): string {
  const hoy = fechaLocalHoy();
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  const [a, m, d] = fecha.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  return `${DIAS[dt.getDay()]} ${d} ${MESES[m - 1]}`;
}

/** ISO UTC → '11 sep 2026, 15:42' en hora del navegador. */
export function fechaHoraLegible(iso: string): string {
  const dt = new Date(iso);
  return `${dt.getDate()} ${MESES[dt.getMonth()]} ${dt.getFullYear()}, ${String(
    dt.getHours(),
  ).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

const RUMBOS = [
  "norte",
  "noreste",
  "este",
  "sudeste",
  "sur",
  "sudoeste",
  "oeste",
  "noroeste",
] as const;

/**
 * Traduce la dirección del viento a rumbos.
 *
 * Open-Meteo informa DESDE dónde sopla; para pulverizar lo que importa es
 * hacia dónde va la deriva, que es el rumbo opuesto. Se devuelven los dos
 * porque el parte meteorológico usa uno y el aplicador necesita el otro.
 */
export function rumboViento(grados: number): { desde: string; hacia: string } {
  const i = ((Math.round(grados / 45) % 8) + 8) % 8;
  return { desde: RUMBOS[i], hacia: RUMBOS[(i + 4) % 8] };
}

export function hectareas(areaHa: number): string {
  return `${areaHa.toLocaleString("es-AR", { maximumFractionDigits: 1 })} ha`;
}

/**
 * Fecha de HOY en hora local, no UTC. `toISOString()` devuelve la fecha UTC:
 * en Argentina (UTC-3) a partir de las 21:00 ya es la de mañana, y una API
 * que sólo acepta fechas pasadas rechaza esa consulta.
 */
export function fechaLocalHoy(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate(),
  ).padStart(2, "0")}`;
}

function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const dt = new Date(a, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}`;
}
