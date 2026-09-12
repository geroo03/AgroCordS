/**
 * Configuración del proveedor satelital. Sólo se importa desde código de
 * SERVIDOR (API route y `lib/satelital/*`): las credenciales jamás llegan al
 * bundle del navegador.
 */

import type { NivelConfianza } from "./tipos";

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
 * confiable. Es también el piso de `clasificarConfianza`: por encima el valor
 * se informa (con el nivel que corresponda), por debajo la confianza es
 * `"nula"`.
 *
 * **Decisión documentada**: un spec de referencia fija este umbral en 40 %.
 * Acá se usa 50 %, deliberadamente más estricto — con menos de medio lote
 * limpio, el promedio describe mejor al sector que quedó despejado que al
 * lote, y el módulo prefiere no informar antes que informar de más. Si se
 * quisiera alinear con ese spec, alcanza con bajar esta constante a 0.4: el
 * resto del módulo la lee de acá y no hay ningún 0,5 suelto en el código.
 */
export const FRACCION_LIMPIA_MINIMA = 0.5;

/**
 * Umbrales de `NivelConfianza` sobre la misma fracción de píxeles limpios.
 * Son cortes de presentación, no de cálculo: sólo `FRACCION_LIMPIA_MINIMA`
 * decide si se informa un valor o no. Orientativos, con el mismo criterio de
 * honestidad que los umbrales de vigor en `ndvi.ts`.
 */
export const UMBRAL_CONFIANZA = { alta: 0.9, media: 0.7 } as const;

/**
 * Traduce la fracción de píxeles limpios sobre el lote (0-1) al nivel que
 * viaja en cada `ObservacionSatelital`. Mantiene la invariante del tipo:
 * devuelve `"nula"` exactamente cuando la observación no lleva valores.
 */
export function clasificarConfianza(fraccionLimpia: number): NivelConfianza {
  if (fraccionLimpia < FRACCION_LIMPIA_MINIMA) return "nula";
  if (fraccionLimpia < UMBRAL_CONFIANZA.media) return "baja";
  if (fraccionLimpia < UMBRAL_CONFIANZA.alta) return "media";
  return "alta";
}

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
