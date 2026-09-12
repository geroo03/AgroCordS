/**
 * Persistencia de lotes y aplicaciones.
 *
 * Con sesión de Supabase activa, lee y escribe contra el backend (tabla
 * `lotes`/`aplicaciones`, ver server/): estas funciones son async de
 * verdad. Sin sesión ("Seguir sin cuenta", modo local — el único camino que
 * existía antes de conectar el backend) siguen usando `localStorage`,
 * envueltas en una Promise para que el resto de la app las llame de una
 * sola forma sin importar el modo.
 *
 * Un fallo de red en modo con sesión (backend caído, sin conexión) degrada a
 * localStorage como respaldo, en vez de romper la pantalla — mismo criterio
 * de honestidad y resiliencia que el resto de la app (NDVI, el chat, plan.ts).
 */

import type { Polygon } from "geojson";
import {
  crearAplicacionRemota,
  crearLoteRemoto,
  listarAplicacionesDeLoteRemoto,
  listarAplicacionesRemoto,
  listarLotesRemoto,
  obtenerLoteRemoto,
} from "./api/cliente";
import { medirPoligono } from "./geo";
import type { HourAssessment, ProductType } from "./spray-engine";
import { obtenerSesionActual } from "./supabaseClient";
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

function listarLotesLocal(): Lote[] {
  return leer<Lote>(CLAVE_LOTES)
    .map((lote) => ({ ...lote, fechaSiembra: lote.fechaSiembra ?? null }))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function listarLotes(): Promise<Lote[]> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return listarLotesLocal();
  try {
    return await listarLotesRemoto();
  } catch {
    return listarLotesLocal();
  }
}

export async function obtenerLote(id: string): Promise<Lote | null> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return leer<Lote>(CLAVE_LOTES).find((l) => l.id === id) ?? null;
  try {
    return await obtenerLoteRemoto(id);
  } catch {
    return leer<Lote>(CLAVE_LOTES).find((l) => l.id === id) ?? null;
  }
}

export interface NuevoLote {
  nombre: string;
  cultivo: string | null;
  fechaSiembra?: string | null;
  geometry: Polygon;
}

export async function guardarLote(datos: NuevoLote): Promise<Lote> {
  // Las medidas se calculan siempre acá, en el cliente: el backend las
  // recibe ya resueltas, no las vuelve a calcular por su cuenta.
  const medidas = medirPoligono(datos.geometry);
  const sesion = await obtenerSesionActual();

  if (sesion) {
    try {
      return await crearLoteRemoto({
        nombre: datos.nombre,
        cultivo: datos.cultivo,
        fechaSiembra: datos.fechaSiembra ?? null,
        geometry: datos.geometry,
        ...medidas,
      });
    } catch {
      // Sin red, el alta no se pierde: cae al localStorage de este
      // dispositivo, igual que en modo local.
    }
  }

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

function listarTodasLasAplicacionesLocal(): Aplicacion[] {
  return leer<Aplicacion>(CLAVE_APLICACIONES).sort((a, b) =>
    b.aplicadaEn.localeCompare(a.aplicadaEn),
  );
}

export async function listarTodasLasAplicaciones(): Promise<Aplicacion[]> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return listarTodasLasAplicacionesLocal();
  try {
    return await listarAplicacionesRemoto();
  } catch {
    return listarTodasLasAplicacionesLocal();
  }
}

function listarAplicacionesLocal(loteId: string): Aplicacion[] {
  return leer<Aplicacion>(CLAVE_APLICACIONES)
    .filter((a) => a.loteId === loteId)
    .sort((a, b) => b.aplicadaEn.localeCompare(a.aplicadaEn));
}

export async function listarAplicaciones(loteId: string): Promise<Aplicacion[]> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return listarAplicacionesLocal(loteId);
  try {
    return await listarAplicacionesDeLoteRemoto(loteId);
  } catch {
    return listarAplicacionesLocal(loteId);
  }
}

export interface NuevaAplicacion {
  loteId: string;
  productoNombre: string;
  tipoProducto: ProductType;
  condiciones: HourAssessment;
  notas: string | null;
}

export async function guardarAplicacion(datos: NuevaAplicacion): Promise<Aplicacion> {
  const sesion = await obtenerSesionActual();

  if (sesion) {
    try {
      return await crearAplicacionRemota(datos);
    } catch {
      // Sin red, el registro no se pierde: cae al localStorage de este
      // dispositivo, igual que en modo local.
    }
  }

  const aplicacion: Aplicacion = {
    id: crypto.randomUUID(),
    aplicadaEn: new Date().toISOString(),
    ...datos,
  };
  escribir(CLAVE_APLICACIONES, [...leer<Aplicacion>(CLAVE_APLICACIONES), aplicacion]);
  return aplicacion;
}

// ── Lotes de ejemplo para la demo ────────────────────────────

/**
 * Lotes de ejemplo. Las coordenadas NO son los centros de las ciudades: se
 * eligieron midiendo NDVI real con Sentinel-2 sobre varios candidatos, porque
 * las anteriores caían sobre el casco urbano y el "vigor" que mostraban era
 * el de un pueblo, no el de un cultivo.
 *
 * Los tres son trigo porque en septiembre, en Córdoba, es lo que está en pie:
 * la soja y el maíz todavía no se sembraron. Además es el cultivo con umbral
 * de helada propio, que es el riesgo de la época.
 *
 * Cada uno cuenta algo distinto, medido:
 *   Villa María    NDVI ~0,70 y parejo  → cultivo en pleno desarrollo.
 *   Marcos Juárez  NDVI ~0,43 muy disperso → lote desparejo por dentro.
 *   Río Cuarto     NDVI ~0,45 intermedio.
 */
const DEMOS = [
  { nombre: "El Bajo — Villa María", cultivo: "Trigo", lat: -32.41, lng: -63.14, anchoKm: 1.5, altoKm: 0.55, fechaSiembra: "2026-06-05" },
  { nombre: "La Esperanza — Marcos Juárez", cultivo: "Trigo", lat: -32.78, lng: -62.1, anchoKm: 1.2, altoKm: 0.7, fechaSiembra: "2026-06-20" },
  { nombre: "Don Emilio — Río Cuarto", cultivo: "Trigo", lat: -33.04, lng: -64.35, anchoKm: 0.9, altoKm: 0.9, fechaSiembra: "2026-06-15" },
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

export async function cargarLotesDemo(): Promise<Lote[]> {
  for (const d of DEMOS) {
    await guardarLote({
      nombre: d.nombre,
      cultivo: d.cultivo,
      fechaSiembra: d.fechaSiembra,
      geometry: rectangulo(d.lat, d.lng, d.anchoKm, d.altoKm),
    });
  }
  return listarLotes();
}
