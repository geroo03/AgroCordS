/**
 * Puente Agro → Fintech.
 *
 * Convierte datos que la app YA produce — el `HourAssessment` congelado de
 * cada aplicación, la mejor ventana de las próximas 72 h, la serie de vigor
 * satelital — en dos cosas que un jurado, un banco o una aseguradora
 * entienden mejor que Delta-T:
 *
 *   1. `estimarValorDecision` — cuánto representa, en pesos, aplicar ahora
 *      contra esperar la mejor ventana disponible.
 *   2. `calcularScoreManejo` — un índice 0-100 de "buenas prácticas" por
 *      lote: qué fracción de las aplicaciones registradas se hizo en
 *      condiciones aceptables u óptimas, más la estabilidad del vigor
 *      vegetativo real. Es el tipo de dato que un seguro paramétrico o una
 *      línea de crédito agro usaría para tarificar riesgo: manejo medible y
 *      auditable como reduce el riesgo de siniestro/pérdida.
 *
 * A propósito NO decide nada: `spray-engine.ts` sigue siendo la única
 * fuente de la decisión de aplicar. Este archivo sólo reinterpreta datos ya
 * existentes; nunca los altera ni los usa como criterio de aplicación.
 *
 * IMPORTANTE — metodología ilustrativa. Los pesos, el costo por hectárea y
 * los umbrales de abajo son un punto de partida razonable para una demo,
 * NO un modelo actuarial calibrado con datos de siniestros reales. Antes de
 * usarse para tarificar una póliza o una línea de crédito de verdad,
 * requiere validación actuarial — mismo espíritu que el aviso en
 * `spray-engine.ts` sobre revisar los umbrales con un ingeniero agrónomo.
 */

import type { HourAssessment, SprayWindow, Suitability } from "./spray-engine";
import type { ObservacionSatelital } from "./satelital/tipos";
import type { Aplicacion } from "./tipos";

// ── Valor económico de la decisión ──────────────────────────────

/**
 * Costo promedio estimado de una aplicación terrestre en cultivos
 * extensivos argentinos (producto + labor), en ARS por hectárea. Supuesto
 * editable para la demo — en producción vendría del producto elegido
 * (precio × dosis) o de un valor que carga el productor. Centralizado acá
 * para que ajustarlo sea una sola edición, mismo patrón que THRESHOLDS en
 * `spray-engine.ts`.
 */
export const COSTO_PROMEDIO_HA_ARS = 18_000;

/** Diferencia mínima de score (0-100) para considerar relevante esperar. */
const UMBRAL_DIFERENCIA_SCORE = 15;

export interface ValorDecision {
  readonly tipo: "perdida_evitada" | "aplicacion_eficiente";
  /** Pesos ARS estimados, siempre >= 0. */
  readonly montoArs: number;
  readonly mensaje: string;
}

/**
 * Compara el score de la hora actual con el de la mejor ventana futura y
 * traduce la diferencia a pesos sobre las hectáreas reales del lote. Es una
 * proyección lineal simple (menor score de aplicación ≈ mayor pérdida
 * esperada por deriva, evaporación o lavado) pensada para dar magnitud y
 * dirección, no precisión contable.
 */
export function estimarValorDecision(
  actual: HourAssessment | null,
  mejorVentana: SprayWindow | null,
  areaHa: number,
  costoPorHaArs: number = COSTO_PROMEDIO_HA_ARS,
): ValorDecision | null {
  if (!actual) return null;
  const costoTotal = costoPorHaArs * areaHa;

  if (actual.suitability === "no_recomendada") {
    return {
      tipo: "perdida_evitada",
      montoArs: Math.round(costoTotal),
      mensaje: `Aplicar ahora arriesga la inversión completa en este lote: ~$${formatearArs(costoTotal)} en producto y aplicación (estimado).`,
    };
  }

  const diferenciaScore = mejorVentana ? mejorVentana.averageScore - actual.score : 0;
  if (diferenciaScore > UMBRAL_DIFERENCIA_SCORE) {
    const perdidaEstimada = costoTotal * (diferenciaScore / 100);
    return {
      tipo: "perdida_evitada",
      montoArs: Math.round(perdidaEstimada),
      mensaje: `Esperando la mejor ventana se reduce la pérdida esperada de eficiencia en ~$${formatearArs(perdidaEstimada)} sobre este lote (estimado).`,
    };
  }

  return {
    tipo: "aplicacion_eficiente",
    montoArs: 0,
    mensaje: "Este momento ya está cerca del mejor disponible en 72 h: sin pérdida de eficiencia relevante estimada.",
  };
}

// ── Score de manejo (insumo para seguro/crédito agro) ───────────

export type BandaScore = "alto" | "medio" | "bajo";

export const ETIQUETA_BANDA: Record<BandaScore, string> = {
  alto: "Manejo consistente",
  medio: "Manejo variable",
  bajo: "Manejo a mejorar",
};

export interface FactorScore {
  readonly etiqueta: string;
  readonly detalle: string;
  /** Aporte al score, puede ser negativo. */
  readonly puntos: number;
}

export interface ScoreManejo {
  /** 0-100. */
  readonly score: number;
  readonly banda: BandaScore;
  readonly factores: readonly FactorScore[];
  /** false cuando no hay datos suficientes para un score confiable. */
  readonly confiable: boolean;
}

const RANGO_SUITABILITY: Record<Suitability, number> = {
  no_recomendada: 0,
  marginal: 1,
  aceptable: 2,
  optima: 3,
};

/**
 * Índice 0-100 de manejo por lote, a partir de dos señales que la app ya
 * genera — nunca inventadas para la ocasión:
 *
 *  - Condiciones de aplicación: fracción de las aplicaciones registradas
 *    hechas en condiciones aceptables u óptimas, según el `HourAssessment`
 *    congelado en cada `Aplicacion` (no se recalcula con umbrales de hoy).
 *  - Estabilidad de vigor: desviación de NDVI entre observaciones reales
 *    sin nubes; un manejo sostenido tiende a vigor estable, una caída
 *    brusca puede señalar estrés hídrico, plagas o una aplicación mal
 *    timeada.
 *
 * Sin aplicaciones ni observaciones de vigor válidas no hay score
 * confiable: se devuelve `confiable: false` y la UI debe decirlo en vez de
 * mostrar un número sin sustento.
 */
export function calcularScoreManejo(
  aplicaciones: readonly Aplicacion[],
  observaciones: readonly ObservacionSatelital[],
): ScoreManejo {
  const factores: FactorScore[] = [];
  let score = 50; // punto de partida neutral

  if (aplicaciones.length > 0) {
    const buenas = aplicaciones.filter(
      (a) => RANGO_SUITABILITY[a.condiciones.suitability] >= RANGO_SUITABILITY.aceptable,
    ).length;
    const fraccion = buenas / aplicaciones.length;
    const puntos = Math.round((fraccion - 0.5) * 60); // -30 a +30
    score += puntos;
    factores.push({
      etiqueta: "Condiciones de aplicación",
      detalle: `${buenas} de ${aplicaciones.length} aplicaciones registradas en condiciones aceptables u óptimas.`,
      puntos,
    });
  }

  const validas = observaciones.filter(
    (o): o is ObservacionSatelital & { ndvi: number } => o.ndvi !== null,
  );
  if (validas.length >= 2) {
    const valores = validas.map((o) => o.ndvi);
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    const varianza =
      valores.reduce((a, b) => a + (b - promedio) ** 2, 0) / valores.length;
    const desviacion = Math.sqrt(varianza);
    // Sobre una escala NDVI 0-1, una desviación > 0,15 entre pasadas ya es
    // un salto grande. Desviación baja suma; alta resta.
    const puntos = Math.round(clamp((0.15 - desviacion) / 0.15, -1, 1) * 20); // -20 a +20
    score += puntos;
    factores.push({
      etiqueta: "Estabilidad de vigor (NDVI)",
      detalle: `Desviación de NDVI de ${desviacion.toFixed(2)} en ${validas.length} observaciones sin nubes.`,
      puntos,
    });
  }

  const confiable = aplicaciones.length > 0 || validas.length >= 2;
  const scoreFinal = Math.round(clamp(score, 0, 100));

  return {
    score: scoreFinal,
    banda: scoreFinal >= 70 ? "alto" : scoreFinal >= 45 ? "medio" : "bajo",
    factores,
    confiable,
  };
}

function clamp(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}

function formatearArs(valor: number): string {
  return Math.round(valor).toLocaleString("es-AR");
}
