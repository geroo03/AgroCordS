/**
 * Proveedor: Sentinel Hub (Copernicus Data Space Ecosystem) sobre Sentinel-2 L2A.
 *
 * Única frontera con el servicio externo, igual que `openmeteo.ts` lo es con
 * el clima. Flujo:
 *
 *   OAuth2 client_credentials (token cacheado en memoria)
 *     → Statistical API (POST, polígono GeoJSON + evalscript)
 *       → estadísticas por fecha de adquisición sobre el lote
 *         → ObservacionSatelital[]
 *
 * Se usa la Statistical API y no la Process API a propósito: sólo se
 * necesitan promedios sobre el polígono, no el raster. Todo corre en el
 * servidor: ni el token ni el secreto pasan por el navegador.
 */

import type { Polygon } from "geojson";
import { medirPoligono } from "../geo";
import { FRACCION_LIMPIA_MINIMA, type CredencialesSentinelHub } from "./config";
import { EVALSCRIPT_NDVI_NDRE } from "./evalscript";
import { ErrorSatelital, type ObservacionSatelital } from "./tipos";

const TIMEOUT_TOKEN_MS = 8_000;
const TIMEOUT_STATS_MS = 15_000;
/** Renovar el token con este margen antes de que expire. */
const MARGEN_EXPIRACION_MS = 60_000;
/** Resolución objetivo en metros (la nativa de B04/B08). */
const RESOLUCION_M = 10;
const METROS_POR_GRADO = 111_320;

// ── OAuth2 ───────────────────────────────────────────────────

interface TokenCacheado {
  valor: string;
  expiraEn: number;
}

let tokenCacheado: TokenCacheado | null = null;

async function obtenerTokenAcceso(credenciales: CredencialesSentinelHub): Promise<string> {
  if (tokenCacheado && Date.now() < tokenCacheado.expiraEn - MARGEN_EXPIRACION_MS) {
    return tokenCacheado.valor;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(credenciales.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credenciales.clientId,
        client_secret: credenciales.clientSecret,
      }),
      signal: AbortSignal.timeout(TIMEOUT_TOKEN_MS),
    });
  } catch (err) {
    throw new ErrorSatelital(
      "TIMEOUT",
      "No se pudo contactar el servidor de autenticación de Sentinel Hub.",
      err,
    );
  }

  if (!respuesta.ok) {
    throw new ErrorSatelital(
      "AUTH_ERROR",
      `Sentinel Hub rechazó las credenciales (HTTP ${respuesta.status}).`,
    );
  }

  const datos = (await respuesta.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
  } | null;
  if (!datos?.access_token) {
    throw new ErrorSatelital("AUTH_ERROR", "La respuesta de autenticación no incluyó un token.");
  }

  tokenCacheado = {
    valor: datos.access_token,
    expiraEn: Date.now() + (datos.expires_in ?? 3600) * 1000,
  };
  return tokenCacheado.valor;
}

/** Sólo para tests: descarta el token cacheado entre casos. */
export function _resetTokenParaTests(): void {
  tokenCacheado = null;
}

// ── Statistical API ──────────────────────────────────────────

export interface ParametrosConsultaSentinelHub {
  readonly polygon: Polygon;
  /** 'YYYY-MM-DD' */
  readonly desde: string;
  /** 'YYYY-MM-DD' */
  readonly hasta: string;
  /** Nubosidad máxima de la escena (0-100) para incluir una pasada. */
  readonly coberturaNubesMax: number;
}

export async function consultarEstadisticasSentinelHub(
  credenciales: CredencialesSentinelHub,
  parametros: ParametrosConsultaSentinelHub,
): Promise<ObservacionSatelital[]> {
  const token = await obtenerTokenAcceso(credenciales);

  const rango = {
    from: `${parametros.desde}T00:00:00Z`,
    to: `${parametros.hasta}T23:59:59Z`,
  };
  const { resx, resy } = resolucionEnGrados(parametros.polygon);

  const cuerpo = {
    input: {
      bounds: {
        geometry: parametros.polygon,
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: rango,
            maxCloudCoverage: parametros.coberturaNubesMax,
          },
        },
      ],
    },
    aggregation: {
      timeRange: rango,
      // Un intervalo por día: Sentinel Hub devuelve sólo los días con pasada.
      aggregationInterval: { of: "P1D" },
      evalscript: EVALSCRIPT_NDVI_NDRE,
      resx,
      resy,
    },
  };

  let respuesta: Response;
  try {
    respuesta = await fetch(credenciales.statsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIMEOUT_STATS_MS),
    });
  } catch (err) {
    throw new ErrorSatelital("TIMEOUT", "La consulta a Sentinel Hub excedió el tiempo de espera.", err);
  }

  if (respuesta.status === 429) {
    throw new ErrorSatelital("RATE_LIMIT", "Sentinel Hub devolvió 429: límite de solicitudes.");
  }
  if (!respuesta.ok) {
    const detalle = (await respuesta.text().catch(() => "")).slice(0, 300);
    if (respuesta.status === 400) {
      throw new ErrorSatelital(
        "INVALID_POLYGON",
        `Sentinel Hub rechazó la solicitud (posible geometría inválida): ${detalle}`,
      );
    }
    throw new ErrorSatelital(
      "SENTINEL_API_ERROR",
      `Sentinel Hub respondió HTTP ${respuesta.status}: ${detalle}`,
    );
  }

  const json: unknown = await respuesta.json().catch(() => null);
  return parsearRespuestaEstadisticas(json, fraccionDelBbox(parametros.polygon));
}

/**
 * Resolución de 10 m expresada en grados (el bbox se envía en EPSG:4326).
 * Un grado de longitud se acorta con el coseno de la latitud.
 */
function resolucionEnGrados(polygon: Polygon): { resx: number; resy: number } {
  const anillo = polygon.coordinates[0] ?? [];
  const latMedia =
    anillo.length > 0 ? anillo.reduce((acc, [, lat]) => acc + lat, 0) / anillo.length : 0;
  const cosLat = Math.max(Math.cos((latMedia * Math.PI) / 180), 0.1);
  return {
    resx: RESOLUCION_M / (METROS_POR_GRADO * cosLat),
    resy: RESOLUCION_M / METROS_POR_GRADO,
  };
}

/**
 * Qué fracción del rectángulo envolvente ocupa el polígono. La Statistical API
 * cuenta como "sin dato" tanto los píxeles nublados como los que caen fuera
 * del polígono; para aislar la nubosidad SOBRE EL LOTE se normaliza por esta
 * fracción geométrica, que no depende de la fecha.
 */
function fraccionDelBbox(polygon: Polygon): number {
  const anillo = polygon.coordinates[0] ?? [];
  if (anillo.length < 4) return 1;
  let oeste = Infinity;
  let este = -Infinity;
  let sur = Infinity;
  let norte = -Infinity;
  for (const [lng, lat] of anillo) {
    oeste = Math.min(oeste, lng);
    este = Math.max(este, lng);
    sur = Math.min(sur, lat);
    norte = Math.max(norte, lat);
  }
  const bbox: Polygon = {
    type: "Polygon",
    coordinates: [
      [
        [oeste, sur],
        [este, sur],
        [este, norte],
        [oeste, norte],
        [oeste, sur],
      ],
    ],
  };
  const areaBbox = medirPoligono(bbox).areaHa;
  const areaLote = medirPoligono(polygon).areaHa;
  if (areaBbox <= 0 || areaLote <= 0) return 1;
  return Math.min(1, areaLote / areaBbox);
}

// ── Normalización de la respuesta ────────────────────────────

/**
 * Traduce la respuesta cruda de la Statistical API al dominio.
 *
 * Sigue el esquema documentado por Sentinel Hub al escribir esto: `data[]`
 * con `interval.from` y `outputs.<id>.bands.B0.stats` (`mean`,
 * `sampleCount`, `noDataCount`). `sampleCount` es el total de píxeles del
 * intervalo y `noDataCount` los enmascarados por `dataMask` (fuera del
 * polígono o nublados); las estadísticas se calculan sobre la diferencia.
 * Si Copernicus cambiara el formato, ajustar sólo esta función.
 *
 * Reglas:
 * - Un intervalo sin muestras o sin outputs no representa una pasada: se OMITE.
 *   Nunca se inventa una lectura para rellenar el calendario.
 * - Un intervalo con pasada pero con pocos píxeles limpios sobre el lote
 *   (`FRACCION_LIMPIA_MINIMA`) se conserva con `ndvi`/`ndre` en null: hubo
 *   satélite, no hubo dato confiable.
 */
export function parsearRespuestaEstadisticas(
  json: unknown,
  fraccionLoteEnBbox: number,
): ObservacionSatelital[] {
  const intervalos = extraerArreglo(json, ["data"]);
  const observaciones: ObservacionSatelital[] = [];

  for (const intervalo of intervalos) {
    const fecha = extraerTexto(intervalo, ["interval", "from"])?.slice(0, 10);
    if (!fecha) continue;

    const muestras = extraerNumero(intervalo, ["outputs", "ndvi", "bands", "B0", "stats", "sampleCount"]);
    if (muestras === null || muestras <= 0) continue;

    const sinDato = extraerNumero(intervalo, ["outputs", "ndvi", "bands", "B0", "stats", "noDataCount"]) ?? 0;
    const fraccionValidaBbox = Math.max(0, muestras - sinDato) / muestras;
    const fraccionLimpiaLote = Math.min(1, fraccionValidaBbox / Math.max(fraccionLoteEnBbox, 1e-6));
    const coberturaNubesPct = Math.round((1 - fraccionLimpiaLote) * 100);
    const confiable = fraccionLimpiaLote >= FRACCION_LIMPIA_MINIMA;

    const ndvi = confiable
      ? redondear(extraerNumero(intervalo, ["outputs", "ndvi", "bands", "B0", "stats", "mean"]))
      : null;
    const ndre = confiable
      ? redondear(extraerNumero(intervalo, ["outputs", "ndre", "bands", "B0", "stats", "mean"]))
      : null;

    observaciones.push({ fecha, ndvi, ndre, coberturaNubesPct });
  }

  return observaciones.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function navegar(obj: unknown, ruta: readonly string[]): unknown {
  let actual: unknown = obj;
  for (const clave of ruta) {
    if (actual === null || typeof actual !== "object") return undefined;
    actual = (actual as Record<string, unknown>)[clave];
  }
  return actual;
}

function extraerArreglo(obj: unknown, ruta: readonly string[]): unknown[] {
  const valor = navegar(obj, ruta);
  return Array.isArray(valor) ? valor : [];
}

function extraerTexto(obj: unknown, ruta: readonly string[]): string | null {
  const valor = navegar(obj, ruta);
  return typeof valor === "string" ? valor : null;
}

function extraerNumero(obj: unknown, ruta: readonly string[]): number | null {
  const valor = navegar(obj, ruta);
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

function redondear(valor: number | null): number | null {
  return valor === null ? null : Math.round(valor * 100) / 100;
}
