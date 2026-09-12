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

/**
 * Cuánto respaldo tiene el valor informado en una fecha, según qué proporción
 * del lote quedó con píxeles limpios en esa pasada.
 *
 * Existe porque el corte binario de `FRACCION_LIMPIA_MINIMA` no alcanza: una
 * observación con el 51 % del lote limpio y otra con el 99 % se informaban
 * idénticas, y no lo son. Los umbrales viven en `config.ts` y la derivación,
 * en `clasificarConfianza`.
 *
 *   alta  — prácticamente todo el lote limpio.
 *   media — mayoría limpia, con nubes o sombras en un sector.
 *   baja  — apenas por encima del mínimo: el valor se informa, con reserva.
 *   nula  — por debajo del mínimo; `ndvi`/`ndre` vienen en `null`.
 */
export type NivelConfianza = "alta" | "media" | "baja" | "nula";

/** Cómo se reparte el índice dentro del polígono en una pasada. */
export interface VariabilidadLote {
  /** Desvío estándar del NDVI entre los píxeles limpios del lote. */
  readonly desvio: number;
  /** El décimo peor del lote está por debajo de este NDVI. */
  readonly p10: number;
  /** El décimo mejor está por encima de este NDVI. */
  readonly p90: number;
}

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
  /**
   * Confianza del valor informado. `null` cuando la fuente no la puede
   * calcular (demo): en una serie sintética no hay píxeles que contar, y
   * declarar "alta" sería mentir sobre un dato que no se midió.
   *
   * Invariante: `confianza === "nula"` ⟺ `ndvi`/`ndre` son `null`.
   */
  readonly confianza: NivelConfianza | null;

  /**
   * Cómo se reparte el NDVI DENTRO del lote en esa pasada.
   *
   * El promedio solo describe a un lote que no existe: con media 0,30, un
   * décimo del lote en 0,07 y otro décimo en 0,74, no hay ningún sector que
   * valga 0,30. La dispersión es lo que dice si la media representa al lote o
   * esconde dos lotes adentro de uno — y con eso, si conviene recorrerlo.
   *
   * Sentinel Hub ya devolvía el desvío en la misma respuesta que veníamos
   * consultando; los percentiles se piden aparte. `null` en la serie de
   * demostración, donde no hay píxeles que medir.
   */
  readonly variabilidad: VariabilidadLote | null;
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

/**
 * Etiquetas para la UI. Viven acá y no en `config.ts` porque este archivo no
 * toca `process.env` y es el único del módulo que el navegador puede importar.
 */
export const ETIQUETA_CONFIANZA: Record<NivelConfianza, string> = {
  alta: "Confianza alta",
  media: "Confianza media",
  baja: "Confianza baja",
  nula: "Sin dato confiable",
};
