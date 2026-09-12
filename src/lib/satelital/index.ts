/**
 * Punto de entrada del módulo satelital (NDVI/NDRE).
 *
 * `obtenerSerieSatelital` es lo único que el resto de la app importa de acá.
 * Decide, en este orden:
 *
 *   1. Sin SENTINELHUB_CLIENT_ID / SENTINELHUB_CLIENT_SECRET → fallback de
 *      demostración (`generarSerieDemo` de `lib/ndvi.ts`). No es un error:
 *      es cómo corre la demo en local.
 *   2. Con credenciales: cache (6 h) y, si no hay, Statistical API de
 *      Sentinel Hub sobre Sentinel-2 L2A.
 *   3. Si Sentinel Hub falla (autenticación, red, límite, error de API) →
 *      mismo fallback, con el error en el log del servidor y una
 *      `advertencia` legible para el usuario. La app nunca se rompe.
 *   4. Si Sentinel Hub responde pero no hay ninguna pasada útil en el rango →
 *      serie REAL vacía. No se reemplaza por demo: la consulta existió, y
 *      mostrar datos inventados en su lugar sería mentir sobre la fuente.
 *
 * Cambiar de proveedor (Google Earth Engine, Agromonitoring) es escribir otro
 * `consultarEstadisticas...` y cambiar a cuál llama este archivo: `tipos.ts`,
 * la API route y toda la UI quedan como están.
 */

import type { Polygon } from "geojson";
import { generarSerieDemo } from "../ndvi";
import { guardarEnCache, hashEstable, obtenerDeCache } from "./cache";
import { leerCredencialesSentinelHub, TTL_CACHE_MS } from "./config";
import { consultarEstadisticasSentinelHub } from "./sentinelhub";
import { ErrorSatelital, type CodigoErrorSatelital, type SerieSatelital } from "./tipos";

export type { ObservacionSatelital, SerieSatelital } from "./tipos";

export interface ParametrosSerieSatelital {
  readonly polygon: Polygon;
  /** 'YYYY-MM-DD' */
  readonly desde: string;
  /** 'YYYY-MM-DD' */
  readonly hasta: string;
  /** Nubosidad máxima de la escena, 0-100. */
  readonly coberturaNubesMax: number;
}

/** Lo que ve el usuario por cada código. Nunca detalle técnico ni secretos. */
const MENSAJE_POR_CODIGO: Record<CodigoErrorSatelital, string> = {
  MISSING_CREDENTIALS: "No hay credenciales satelitales configuradas.",
  AUTH_ERROR: "No pudimos autenticar con el proveedor satelital.",
  INVALID_POLYGON: "El proveedor satelital rechazó el polígono del lote.",
  SENTINEL_API_ERROR: "El proveedor satelital no respondió correctamente.",
  NO_VALID_OBSERVATIONS: "No hay observaciones satelitales válidas en el período.",
  RATE_LIMIT: "Alcanzamos el límite de consultas al proveedor satelital.",
  TIMEOUT: "El proveedor satelital demoró demasiado en responder.",
};

const MENSAJE_GENERICO = "No pudimos obtener datos satelitales.";

export async function obtenerSerieSatelital(
  parametros: ParametrosSerieSatelital,
): Promise<SerieSatelital> {
  const credenciales = leerCredencialesSentinelHub();
  if (!credenciales) {
    console.info(
      "[satelital] MISSING_CREDENTIALS: sin SENTINELHUB_CLIENT_ID/SECRET, usando datos de demostración.",
    );
    return serieDemo(parametros);
  }

  const claveCache = [
    hashEstable(JSON.stringify(parametros.polygon)),
    parametros.desde,
    parametros.hasta,
    parametros.coberturaNubesMax,
  ].join(":");
  const enCache = obtenerDeCache<SerieSatelital>(claveCache);
  if (enCache) return enCache;

  try {
    const observaciones = await consultarEstadisticasSentinelHub(credenciales, parametros);
    if (observaciones.length === 0) {
      console.info(
        `[satelital] NO_VALID_OBSERVATIONS: sin pasadas útiles entre ${parametros.desde} y ${parametros.hasta}.`,
      );
    }
    const serie: SerieSatelital = { fuente: "sentinel-2", real: true, observaciones };
    guardarEnCache(claveCache, serie, TTL_CACHE_MS);
    return serie;
  } catch (err) {
    const codigo = err instanceof ErrorSatelital ? err.codigo : "SENTINEL_API_ERROR";
    // Detalle completo sólo en el servidor.
    console.error(`[satelital] ${codigo}: Sentinel Hub falló, usando datos de demostración.`, err);
    return {
      ...serieDemo(parametros),
      advertencia: MENSAJE_POR_CODIGO[codigo] ?? MENSAJE_GENERICO,
    };
  }
}

/**
 * Fallback: reutiliza el generador determinístico de `lib/ndvi.ts`, sembrado
 * con un hash del polígono para que cada lote tenga su curva estable, y
 * recorta al rango pedido.
 */
function serieDemo(parametros: ParametrosSerieSatelital): SerieSatelital {
  const semilla = hashEstable(JSON.stringify(parametros.polygon));
  const observaciones = generarSerieDemo(semilla)
    .filter((l) => l.fecha >= parametros.desde && l.fecha <= parametros.hasta)
    .map((l) => ({ fecha: l.fecha, ndvi: l.ndvi, ndre: l.ndre, coberturaNubesPct: null }));
  return { fuente: "demo", real: false, observaciones };
}
