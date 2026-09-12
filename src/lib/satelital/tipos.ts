/**
 * Tipos del módulo de datos satelitales (NDVI/NDRE).
 *
 * Independientes de React: los usan la API route (servidor), el proveedor
 * (`sentinelhub.ts`) y el fallback de demostración. Son el equivalente, para
 * el vigor vegetativo, de lo que `HourlyConditions`/`HourAssessment` son para
 * el motor de pulverización — y a propósito no se cruzan con él: el satélite
 * responde "¿cómo está el lote?", no "¿se puede aplicar?".
 *
 * Equivalencias con la nomenclatura en inglés usada en la especificación:
 *   ObservacionSatelital ≈ SatelliteObservation
 *   SerieSatelital       ≈ SatelliteSeries
 */

export type FuenteSerieSatelital = "sentinel-2" | "demo";

/** Una observación en una fecha puntual, real o de demostración. */
export interface ObservacionSatelital {
  /**
   * ISO 'YYYY-MM-DD'. Cuando la serie es real, es la fecha de ADQUISICIÓN
   * de Sentinel-2: nunca una fecha inventada para rellenar el calendario.
   */
  readonly fecha: string;
  /** -1 a 1. `null` cuando hubo pasada pero quedó dominada por nubes. */
  readonly ndvi: number | null;
  /** -1 a 1 (en cultivos, ~0 a 0,5). `null` en el mismo caso que `ndvi`. */
  readonly ndre: number | null;
  /**
   * 0 a 100, estimada SOBRE EL LOTE (píxeles nublados o sin dato dentro del
   * polígono), no la nubosidad global de la escena. `null` si la fuente no
   * la informa (demo).
   */
  readonly coberturaNubesPct: number | null;
}

export interface SerieSatelital {
  readonly fuente: FuenteSerieSatelital;
  /**
   * `true` sólo cuando las observaciones vienen de Sentinel-2. Es `false` en
   * cualquier fallback: sin credenciales, error del proveedor, etc. La UI no
   * debe poder confundir un caso con el otro.
   */
  readonly real: boolean;
  readonly observaciones: readonly ObservacionSatelital[];
  /**
   * Mensaje apto para el usuario cuando `real` es false por un ERROR del
   * proveedor (no por diseño, como la falta de credenciales en local).
   */
  readonly advertencia?: string;
}

export type CodigoErrorSatelital =
  | "MISSING_CREDENTIALS"
  | "AUTH_ERROR"
  | "INVALID_POLYGON"
  | "SENTINEL_API_ERROR"
  | "NO_VALID_OBSERVATIONS"
  | "RATE_LIMIT"
  | "TIMEOUT";

/**
 * Error tipado del proveedor. El `message` es para los logs del servidor y
 * puede contener detalle técnico; lo que ve el usuario se decide en
 * `index.ts` a partir del `codigo`, nunca del mensaje.
 */
export class ErrorSatelital extends Error {
  constructor(
    readonly codigo: CodigoErrorSatelital,
    message: string,
    readonly causa?: unknown,
  ) {
    super(message);
    this.name = "ErrorSatelital";
  }
}
