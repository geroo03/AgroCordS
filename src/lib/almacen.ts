/**
 * Persistencia de la demo: localStorage del navegador.
 *
 * Reemplaza a Supabase para que el MVP funcione sin credenciales ni servicios
 * externos. La interfaz imita lo que después serían las consultas con
 * supabase-js + RLS: cambiar de backend toca sólo este archivo (el SQL ya
 * está en el blueprint, sección 5).
 */

import type { Polygon } from "geojson";
import { medirPoligono } from "./geo";
import type { HourAssessment, ProductType } from "./spray-engine";
import type { Aplicacion, Lote } from "./tipos";

const CLAVE_LOTES = "ventana.lotes.v1";
const CLAVE_APLICACIONES = "ventana.aplicaciones.v1";

function leer<T>(clave: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = window.localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T[]) : [];
  } catch {
    return [];
  }
}

function escribir<T>(clave: string, valor: T[]): void {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Almacenamiento bloqueado o lleno: la app sigue, sin persistir.
  }
}

// ── Lotes ────────────────────────────────────────────────────

export function listarLotes(): Lote[] {
  return leer<Lote>(CLAVE_LOTES)
    .map((lote) => ({ ...lote, fechaSiembra: lote.fechaSiembra ?? null }))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export function obtenerLote(id: string): Lote | null {
  return leer<Lote>(CLAVE_LOTES).find((l) => l.id === id) ?? null;
}

export interface NuevoLote {
  nombre: string;
  cultivo: string | null;
  fechaSiembra?: string | null;
  geometry: Polygon;
}

export function guardarLote(datos: NuevoLote): Lote {
  const medidas = medirPoligono(datos.geometry);
  const lote: Lote = {
    id: crypto.randomUUID(),
    nombre: datos.nombre,
    cultivo: datos.cultivo,
    fechaSiembra: datos.fechaSiembra ?? null,
    geometry: datos.geometry,
    ...medidas,
    creadoEn: new Date().toISOString(),
  };
  escribir(CLAVE_LOTES, [...leer<Lote>(CLAVE_LOTES), lote]);
  return lote;
}

// ── Aplicaciones ─────────────────────────────────────────────

export function listarTodasLasAplicaciones(): Aplicacion[] {
  return leer<Aplicacion>(CLAVE_APLICACIONES).sort((a, b) =>
    b.aplicadaEn.localeCompare(a.aplicadaEn),
  );
}

export function listarAplicaciones(loteId: string): Aplicacion[] {
  return leer<Aplicacion>(CLAVE_APLICACIONES)
    .filter((a) => a.loteId === loteId)
    .sort((a, b) => b.aplicadaEn.localeCompare(a.aplicadaEn));
}

export interface NuevaAplicacion {
  loteId: string;
  productoNombre: string;
  tipoProducto: ProductType;
  condiciones: HourAssessment;
  notas: string | null;
}

export function guardarAplicacion(datos: NuevaAplicacion): Aplicacion {
  const aplicacion: Aplicacion = {
    id: crypto.randomUUID(),
    aplicadaEn: new Date().toISOString(),
    ...datos,
  };
  escribir(CLAVE_APLICACIONES, [
    ...leer<Aplicacion>(CLAVE_APLICACIONES),
    aplicacion,
  ]);
  return aplicacion;
}

// ── Lotes de ejemplo para la demo ────────────────────────────

const DEMOS = [
  { nombre: "La Esperanza — Marcos Juárez", cultivo: "Soja", lat: -32.7, lng: -62.1, anchoKm: 1.2, altoKm: 0.7 },
  { nombre: "Don Emilio — Río Cuarto", cultivo: "Maíz", lat: -33.12, lng: -64.35, anchoKm: 0.9, altoKm: 0.9 },
  { nombre: "El Bajo — Villa María", cultivo: "Trigo", lat: -32.41, lng: -63.24, anchoKm: 1.5, altoKm: 0.55 },
] as const;

function rectangulo(lat: number, lng: number, anchoKm: number, altoKm: number): Polygon {
  const dLat = altoKm / 2 / 110.574;
  const dLng = anchoKm / 2 / (111.32 * Math.cos((lat * Math.PI) / 180));
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  };
}

export function cargarLotesDemo(): Lote[] {
  for (const d of DEMOS) {
    guardarLote({
      nombre: d.nombre,
      cultivo: d.cultivo,
      geometry: rectangulo(d.lat, d.lng, d.anchoKm, d.altoKm),
    });
  }
  return listarLotes();
}
