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

export function hectareas(areaHa: number): string {
  return `${areaHa.toLocaleString("es-AR", { maximumFractionDigits: 1 })} ha`;
}

function fechaLocalHoy(): string {
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
