/**
 * Fase ENSO (El Niño / La Niña) a partir del índice ONI de la NOAA.
 *
 * ── Qué hace y qué NO hace ──────────────────────────────────
 * El Niño no se previene: es un fenómeno de acoplamiento océano-atmósfera en
 * el Pacífico ecuatorial, de escala global. Lo que este módulo aporta es
 * saber en qué fase está el sistema y qué tendencia de temporada implica
 * para la región, para poder anticiparse en vez de reaccionar.
 *
 * ── Por qué importa en la pampa ─────────────────────────────
 * La relación ENSO-precipitación en la región pampeana está documentada y es
 * de las más consistentes del mundo: la fase cálida (El Niño) se asocia a
 * primaveras y veranos más lluviosos que lo normal, y la fría (La Niña) a
 * déficit. Es una asociación ESTADÍSTICA sobre una temporada, no un
 * pronóstico para un lote ni para una semana, y el módulo lo dice así.
 *
 * ── Escala de tiempo ────────────────────────────────────────
 * Todo lo demás en esta app opera en horas o días. Esto opera en meses, y
 * mezclarlo sería un error de categoría: la fase ENSO NUNCA entra al motor de
 * pulverización ni modifica el veredicto de una hora. Es contexto de
 * temporada, y viaja como tal.
 *
 * Fuente: NOAA Climate Prediction Center, índice ONI (Oceanic Niño Index),
 * dominio público y sin clave. Se actualiza una vez por mes.
 */

/** Umbrales operativos de la NOAA sobre la anomalía ONI, en °C. */
export const UMBRALES_ONI = {
  evento: 0.5,
  moderado: 1.0,
  fuerte: 1.5,
  muyFuerte: 2.0,
} as const;

/**
 * La NOAA declara un episodio con cinco temporadas superpuestas consecutivas
 * por encima del umbral. Con menos se habla de "condiciones presentes", que
 * es una afirmación más débil y el módulo la distingue.
 */
export const TEMPORADAS_PARA_EPISODIO = 5;

export type FaseEnso = "el_nino" | "la_nina" | "neutral";

export type IntensidadEnso = "debil" | "moderado" | "fuerte" | "muy_fuerte";

export type TendenciaEnso = "en_aumento" | "en_descenso" | "estable";

export interface LecturaOni {
  /** Temporada móvil de tres meses, como la publica la NOAA: "JJA". */
  readonly temporada: string;
  readonly anio: number;
  /** Anomalía de temperatura superficial del mar en la región Niño 3.4, °C. */
  readonly anomalia: number;
}

export interface EstadoEnso {
  readonly fase: FaseEnso;
  /** `null` en fase neutral, donde la intensidad no aplica. */
  readonly intensidad: IntensidadEnso | null;
  /** true con cinco temporadas consecutivas sobre el umbral. */
  readonly episodioConfirmado: boolean;
  readonly tendencia: TendenciaEnso;
  readonly ultima: LecturaOni;
  /** Las últimas lecturas, de la más vieja a la más nueva. */
  readonly recientes: readonly LecturaOni[];
}

export const ETIQUETA_FASE: Record<FaseEnso, string> = {
  el_nino: "El Niño",
  la_nina: "La Niña",
  neutral: "Neutral",
};

export const ETIQUETA_INTENSIDAD: Record<IntensidadEnso, string> = {
  debil: "débil",
  moderado: "moderado",
  fuerte: "fuerte",
  muy_fuerte: "muy fuerte",
};

export class EnsoNoDisponibleError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "EnsoNoDisponibleError";
  }
}

/**
 * Parsea el archivo de texto del CPC. Formato de columnas fijas:
 *
 *     SEAS  YR   TOTAL   ANOM
 *      DJF 1950  25.01  -1.32
 */
export function parsearOni(texto: string): LecturaOni[] {
  const lecturas: LecturaOni[] = [];
  for (const linea of texto.split("\n")) {
    const campos = linea.trim().split(/\s+/);
    if (campos.length < 4) continue;
    const [temporada, anio, , anomalia] = campos;
    // Descarta el encabezado y cualquier fila que no sea numérica.
    if (!/^[A-Z]{3}$/.test(temporada)) continue;
    const anioNum = Number(anio);
    const anomaliaNum = Number(anomalia);
    if (!Number.isFinite(anioNum) || !Number.isFinite(anomaliaNum)) continue;
    lecturas.push({ temporada, anio: anioNum, anomalia: anomaliaNum });
  }
  return lecturas;
}

/** Clasifica la fase a partir de la serie completa, de más vieja a más nueva. */
export function clasificarEnso(lecturas: readonly LecturaOni[]): EstadoEnso | null {
  if (lecturas.length === 0) return null;

  const ultima = lecturas[lecturas.length - 1];
  const recientes = lecturas.slice(-6);
  const fase: FaseEnso =
    ultima.anomalia >= UMBRALES_ONI.evento
      ? "el_nino"
      : ultima.anomalia <= -UMBRALES_ONI.evento
        ? "la_nina"
        : "neutral";

  return {
    fase,
    intensidad: fase === "neutral" ? null : intensidadPara(ultima.anomalia),
    episodioConfirmado: contarConsecutivas(lecturas, fase) >= TEMPORADAS_PARA_EPISODIO,
    tendencia: tendenciaPara(lecturas),
    ultima,
    recientes,
  };
}

function intensidadPara(anomalia: number): IntensidadEnso {
  const magnitud = Math.abs(anomalia);
  if (magnitud >= UMBRALES_ONI.muyFuerte) return "muy_fuerte";
  if (magnitud >= UMBRALES_ONI.fuerte) return "fuerte";
  if (magnitud >= UMBRALES_ONI.moderado) return "moderado";
  return "debil";
}

/** Temporadas consecutivas, contando desde la última hacia atrás, en la fase. */
function contarConsecutivas(lecturas: readonly LecturaOni[], fase: FaseEnso): number {
  if (fase === "neutral") return 0;
  const enFase = (a: number) =>
    fase === "el_nino" ? a >= UMBRALES_ONI.evento : a <= -UMBRALES_ONI.evento;

  let cuenta = 0;
  for (let i = lecturas.length - 1; i >= 0; i--) {
    if (!enFase(lecturas[i].anomalia)) break;
    cuenta++;
  }
  return cuenta;
}

/**
 * Hacia dónde va el índice. Se compara la última lectura con la de tres
 * temporadas atrás: una sola temporada es demasiado ruidosa para hablar de
 * tendencia, y el ONI ya es una media móvil de tres meses.
 */
function tendenciaPara(lecturas: readonly LecturaOni[]): TendenciaEnso {
  if (lecturas.length < 4) return "estable";
  const actual = lecturas[lecturas.length - 1].anomalia;
  const previa = lecturas[lecturas.length - 4].anomalia;
  const cambio = actual - previa;
  if (cambio > 0.3) return "en_aumento";
  if (cambio < -0.3) return "en_descenso";
  return "estable";
}

const URL_ONI = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt";

/**
 * Trae el ONI de la NOAA. El índice se publica una vez por mes, así que la
 * caché es deliberadamente larga: consultarlo seguido no aporta nada.
 */
export async function fetchEstadoEnso(signal?: AbortSignal): Promise<EstadoEnso> {
  let texto: string;
  try {
    const res = await fetch(URL_ONI, {
      signal,
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) {
      throw new EnsoNoDisponibleError(`El CPC de la NOAA respondió ${res.status}`);
    }
    texto = await res.text();
  } catch (error) {
    if (error instanceof EnsoNoDisponibleError) throw error;
    throw new EnsoNoDisponibleError("No se pudo consultar el índice ONI", error);
  }

  const estado = clasificarEnso(parsearOni(texto));
  if (!estado) {
    throw new EnsoNoDisponibleError("El índice ONI llegó sin lecturas utilizables");
  }
  return estado;
}
