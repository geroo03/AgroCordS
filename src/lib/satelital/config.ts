/**
 * Configuración del proveedor satelital. Sólo se importa desde código de
 * SERVIDOR (API route y `lib/satelital/*`): las credenciales jamás llegan al
 * bundle del navegador.
 */

/**
 * Nubosidad máxima de la ESCENA (metadato de Sentinel-2, 0-100) para que una
 * pasada entre en la consulta. 30 % es un valor habitual para cultivos
 * extensivos, no una verdad universal: en zonas muy nubosas puede convenir
 * subirlo y filtrar después por la cobertura sobre el lote, que sí se calcula
 * píxel a píxel (ver `evalscript.ts`).
 */
export const DEFAULT_MAX_CLOUD_COVERAGE = 30;

/**
 * Fracción mínima de píxeles limpios (sin nubes, dentro del polígono) para
 * informar un valor de NDVI/NDRE en una fecha. Por debajo, la observación se
 * conserva con valores `null`: existió la pasada, pero no aporta un dato
 * confiable.
 */
export const FRACCION_LIMPIA_MINIMA = 0.5;

/** TTL del cache de series: los modelos de Sentinel-2 no cambian intradía. */
export const TTL_CACHE_MS = 6 * 60 * 60 * 1000;

// Endpoints de Copernicus Data Space Ecosystem (CDSE). Se pueden sobreescribir
// por entorno, por ejemplo para una cuenta de Sentinel Hub "clásica"
// (services.sentinel-hub.com). Verificar contra la documentación vigente al
// configurar credenciales reales.
const TOKEN_URL_POR_DEFECTO =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const STATS_URL_POR_DEFECTO = "https://sh.dataspace.copernicus.eu/api/v1/statistics";

export interface CredencialesSentinelHub {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly tokenUrl: string;
  readonly statsUrl: string;
}

/**
 * Lee las credenciales del entorno del servidor. Devuelve `null` cuando
 * faltan: esa es la señal que usa `obtenerSerieSatelital` para caer al
 * fallback de demostración sin romper la app.
 */
export function leerCredencialesSentinelHub(): CredencialesSentinelHub | null {
  const clientId = process.env.SENTINELHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.SENTINELHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    tokenUrl: process.env.SENTINELHUB_TOKEN_URL?.trim() || TOKEN_URL_POR_DEFECTO,
    statsUrl: process.env.SENTINELHUB_STATS_URL?.trim() || STATS_URL_POR_DEFECTO,
  };
}
