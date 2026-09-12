/**
 * Motor de decisión para ventanas de aplicación de fitosanitarios.
 *
 * Funciones puras, sin I/O ni dependencias. Toda la lógica agronómica vive acá
 * para que sea testeable sin red y auditable por un agrónomo.
 *
 * Umbrales: basados en las guías de aplicación terrestre de uso extendido
 * (Delta-T de GRDC/Bureau of Meteorology, adoptadas por INTA y por los manuales
 * de buenas prácticas de aplicación en Argentina).
 * IMPORTANTE: revisá estos valores con un ingeniero agrónomo antes de
 * presentarlos como recomendación agronómica. Están centralizados en THRESHOLDS
 * justamente para que ajustarlos sea una sola edición.
 */

// ─────────────────────────────────────────────────────────────
// Tipos de dominio
// ─────────────────────────────────────────────────────────────

/** Condiciones meteorológicas de una hora puntual, ya normalizadas. */
export interface HourlyConditions {
  /** ISO 8601 en hora local del lote. */
  readonly time: string;
  /** Temperatura a 2 m, °C. */
  readonly temperatureC: number;
  /** Humedad relativa a 2 m, %. */
  readonly relativeHumidityPct: number;
  /** Viento a 10 m, km/h. */
  readonly windSpeedKmh: number;
  /** Ráfagas a 10 m, km/h. */
  readonly windGustsKmh: number;
  /** Precipitación acumulada en la hora, mm. */
  readonly precipitationMm: number;
  /** Nubosidad total, %. Se usa como proxy de enfriamiento radiativo nocturno. */
  readonly cloudCoverPct: number;
  /** true si la hora es diurna. */
  readonly isDay: boolean;
}

export type Suitability = 'optima' | 'aceptable' | 'marginal' | 'no_recomendada';

export type ProductType = 'sistemico' | 'contacto';

export interface Reason {
  readonly code: ReasonCode;
  /** Texto listo para mostrar al usuario. */
  readonly message: string;
  /** blocker fuerza no_recomendada sin importar el puntaje. */
  readonly severity: 'blocker' | 'warning' | 'info';
}

export type ReasonCode =
  | 'VIENTO_EXCESIVO'
  | 'VIENTO_INSUFICIENTE'
  | 'RAFAGAS'
  | 'DELTA_T_ALTO'
  | 'DELTA_T_BAJO'
  | 'TEMPERATURA_ALTA'
  | 'HUMEDAD_BAJA'
  | 'LLUVIA_EN_CURSO'
  | 'LLUVIA_PROXIMA'
  | 'INVERSION_TERMICA'
  | 'CONDICIONES_OPTIMAS';

export interface HourAssessment {
  readonly time: string;
  readonly suitability: Suitability;
  /** 0-100. Sólo comparativo entre horas, no es una probabilidad. */
  readonly score: number;
  readonly deltaT: number;
  readonly inversionRisk: boolean;
  readonly reasons: readonly Reason[];
  readonly conditions: HourlyConditions;
}

export interface SprayWindow {
  readonly startTime: string;
  readonly endTime: string;
  readonly hours: number;
  readonly averageScore: number;
  readonly bestSuitability: Suitability;
}

// ─────────────────────────────────────────────────────────────
// Umbrales configurables
// ─────────────────────────────────────────────────────────────

export const THRESHOLDS = {
  wind: {
    /** Debajo de esto el aire está demasiado quieto: deriva de larga distancia. */
    minKmh: 3,
    idealMinKmh: 6,
    idealMaxKmh: 15,
    marginalMaxKmh: 20,
  },
  gusts: {
    /** Ráfaga que invalida la hora aunque el viento medio sea aceptable. */
    maxKmh: 25,
  },
  deltaT: {
    idealMin: 2,
    idealMax: 8,
    marginalMax: 10,
  },
  temperature: {
    marginalC: 28,
    maxC: 30,
  },
  humidity: {
    /** Bajo este valor la gota se evapora antes de llegar al objetivo. */
    minPct: 40,
    comfortablePct: 55,
  },
  inversion: {
    maxWindKmh: 5,
    maxCloudCoverPct: 40,
  },
  /** Horas sin lluvia necesarias después de aplicar, por tipo de producto. */
  rainfastHours: {
    sistemico: 1,
    contacto: 4,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Cálculos meteorológicos
// ─────────────────────────────────────────────────────────────

/**
 * Temperatura de bulbo húmedo por la aproximación de Stull (2011).
 * Válida aproximadamente para HR entre 5% y 99% y T entre -20 °C y 50 °C,
 * que cubre cualquier condición en la que alguien consideraría pulverizar.
 */
export function wetBulbC(temperatureC: number, relativeHumidityPct: number): number {
  const t = temperatureC;
  const rh = clamp(relativeHumidityPct, 5, 99);

  return (
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035
  );
}

/**
 * Delta-T: diferencia entre bulbo seco y bulbo húmedo.
 * Es el indicador estándar de evaporación y vida de la gota. Por sí solo
 * explica más sobre la calidad de una aplicación que la humedad relativa.
 */
export function deltaT(temperatureC: number, relativeHumidityPct: number): number {
  return round1(temperatureC - wetBulbC(temperatureC, relativeHumidityPct));
}

/**
 * Riesgo de inversión térmica (proxy, no medición).
 *
 * La inversión real se mide con dos termómetros a distinta altura. Sin esa
 * medición usamos las tres condiciones que casi siempre la acompañan: noche,
 * viento calmo y cielo despejado (enfriamiento radiativo del suelo).
 * Es una aproximación conservadora: prefiere marcar riesgo de más.
 */
export function hasInversionRisk(c: HourlyConditions): boolean {
  return (
    !c.isDay &&
    c.windSpeedKmh < THRESHOLDS.inversion.maxWindKmh &&
    c.cloudCoverPct < THRESHOLDS.inversion.maxCloudCoverPct
  );
}

// ─────────────────────────────────────────────────────────────
// Evaluación por hora
// ─────────────────────────────────────────────────────────────

interface Penalty {
  readonly points: number;
  readonly reason: Reason;
}

/**
 * Evalúa una hora. `upcoming` son las horas siguientes, necesarias para
 * verificar la ventana libre de lluvia (rain-fastness) del producto.
 */
export function assessHour(
  current: HourlyConditions,
  upcoming: readonly HourlyConditions[],
  productType: ProductType = 'sistemico',
): HourAssessment {
  const dt = deltaT(current.temperatureC, current.relativeHumidityPct);
  const inversionRisk = hasInversionRisk(current);
  const penalties: Penalty[] = [];

  // Viento
  if (current.windSpeedKmh > THRESHOLDS.wind.marginalMaxKmh) {
    penalties.push({
      points: 100,
      reason: blocker(
        'VIENTO_EXCESIVO',
        `Viento de ${Math.round(current.windSpeedKmh)} km/h: por encima del máximo para aplicar.`,
      ),
    });
  } else if (current.windSpeedKmh > THRESHOLDS.wind.idealMaxKmh) {
    penalties.push({
      points: 30,
      reason: warning(
        'VIENTO_EXCESIVO',
        `Viento de ${Math.round(current.windSpeedKmh)} km/h: sólo con gota gruesa y pastilla antideriva.`,
      ),
    });
  } else if (current.windSpeedKmh < THRESHOLDS.wind.minKmh) {
    penalties.push({
      points: 100,
      reason: blocker(
        'VIENTO_INSUFICIENTE',
        `Viento de ${Math.round(current.windSpeedKmh)} km/h: aire demasiado quieto, la gota fina queda suspendida y puede derivar lejos.`,
      ),
    });
  } else if (current.windSpeedKmh < THRESHOLDS.wind.idealMinKmh) {
    penalties.push({
      points: 12,
      reason: warning('VIENTO_INSUFICIENTE', 'Viento flojo: atención a la deriva por suspensión.'),
    });
  }

  if (current.windGustsKmh > THRESHOLDS.gusts.maxKmh) {
    penalties.push({
      points: 25,
      reason: warning(
        'RAFAGAS',
        `Ráfagas de hasta ${Math.round(current.windGustsKmh)} km/h con viento medio aceptable.`,
      ),
    });
  }

  // Delta-T
  if (dt > THRESHOLDS.deltaT.marginalMax) {
    penalties.push({
      points: 100,
      reason: blocker('DELTA_T_ALTO', `Delta-T de ${dt}: la gota se evapora antes de llegar al objetivo.`),
    });
  } else if (dt > THRESHOLDS.deltaT.idealMax) {
    penalties.push({
      points: 25,
      reason: warning('DELTA_T_ALTO', `Delta-T de ${dt}: aceptable sólo con gota gruesa.`),
    });
  } else if (dt < THRESHOLDS.deltaT.idealMin) {
    penalties.push({
      points: 20,
      reason: warning('DELTA_T_BAJO', `Delta-T de ${dt}: evaporación muy lenta, suele coincidir con aire estable.`),
    });
  }

  // Temperatura
  if (current.temperatureC > THRESHOLDS.temperature.maxC) {
    penalties.push({
      points: 35,
      reason: warning(
        'TEMPERATURA_ALTA',
        `${Math.round(current.temperatureC)} °C: riesgo de fitotoxicidad y de pérdida por volatilización.`,
      ),
    });
  } else if (current.temperatureC > THRESHOLDS.temperature.marginalC) {
    penalties.push({
      points: 12,
      reason: warning('TEMPERATURA_ALTA', `${Math.round(current.temperatureC)} °C: temperatura en el límite.`),
    });
  }

  // Humedad relativa. Peso bajo a propósito: gran parte de su efecto ya está
  // capturado en Delta-T y no queremos penalizar dos veces lo mismo.
  if (current.relativeHumidityPct < THRESHOLDS.humidity.minPct) {
    penalties.push({
      points: 10,
      reason: warning('HUMEDAD_BAJA', `Humedad relativa de ${Math.round(current.relativeHumidityPct)}%.`),
    });
  }

  // Inversión térmica
  if (inversionRisk) {
    penalties.push({
      points: 100,
      reason: blocker(
        'INVERSION_TERMICA',
        'Condiciones compatibles con inversión térmica: noche, viento calmo y cielo despejado. El producto puede desplazarse a lotes vecinos.',
      ),
    });
  }

  // Lluvia
  if (current.precipitationMm > 0.1) {
    penalties.push({
      points: 100,
      reason: blocker('LLUVIA_EN_CURSO', 'Precipitación durante la hora de aplicación.'),
    });
  } else {
    const needed = THRESHOLDS.rainfastHours[productType];
    const rainWithin = upcoming
      .slice(0, needed)
      .findIndex((h) => h.precipitationMm > 0.5);

    if (rainWithin >= 0) {
      penalties.push({
        points: 100,
        reason: blocker(
          'LLUVIA_PROXIMA',
          `Lluvia prevista dentro de ${rainWithin + 1} h. Un producto ${productType} necesita ${needed} h sin lluvia para no lavarse.`,
        ),
      });
    }
  }

  const hasBlocker = penalties.some((p) => p.reason.severity === 'blocker');
  const score = hasBlocker
    ? 0
    : clamp(100 - penalties.reduce((acc, p) => acc + p.points, 0), 0, 100);

  const reasons =
    penalties.length > 0
      ? penalties.map((p) => p.reason)
      : [info('CONDICIONES_OPTIMAS', `Delta-T ${dt}, viento ${Math.round(current.windSpeedKmh)} km/h. Condiciones adecuadas.`)];

  return {
    time: current.time,
    suitability: toSuitability(score, hasBlocker),
    score,
    deltaT: dt,
    inversionRisk,
    reasons,
    conditions: current,
  };
}

export function assessSeries(
  hours: readonly HourlyConditions[],
  productType: ProductType = 'sistemico',
): HourAssessment[] {
  return hours.map((h, i) => assessHour(h, hours.slice(i + 1), productType));
}

// ─────────────────────────────────────────────────────────────
// Agrupación en ventanas
// ─────────────────────────────────────────────────────────────

/**
 * Colapsa horas consecutivas aplicables en ventanas.
 * Una ventana de una sola hora no sirve en la práctica: no alcanza para
 * preparar el equipo y entrar al lote. De ahí el mínimo por defecto de 2 h.
 */
export function findWindows(
  assessments: readonly HourAssessment[],
  { minHours = 2, minSuitability = 'aceptable' as Suitability } = {},
): SprayWindow[] {
  const rank: Record<Suitability, number> = {
    no_recomendada: 0,
    marginal: 1,
    aceptable: 2,
    optima: 3,
  };
  const threshold = rank[minSuitability];

  const windows: SprayWindow[] = [];
  let run: HourAssessment[] = [];

  const flush = (): void => {
    if (run.length >= minHours) {
      const best = run.reduce((a, b) => (rank[b.suitability] > rank[a.suitability] ? b : a));
      windows.push({
        startTime: run[0].time,
        endTime: run[run.length - 1].time,
        hours: run.length,
        averageScore: Math.round(run.reduce((acc, a) => acc + a.score, 0) / run.length),
        bestSuitability: best.suitability,
      });
    }
    run = [];
  };

  for (const a of assessments) {
    if (rank[a.suitability] >= threshold) run.push(a);
    else flush();
  }
  flush();

  return windows.sort((a, b) => b.averageScore - a.averageScore);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function toSuitability(score: number, hasBlocker: boolean): Suitability {
  if (hasBlocker || score < 40) return 'no_recomendada';
  if (score < 65) return 'marginal';
  if (score < 85) return 'aceptable';
  return 'optima';
}

const blocker = (code: ReasonCode, message: string): Reason => ({ code, message, severity: 'blocker' });
const warning = (code: ReasonCode, message: string): Reason => ({ code, message, severity: 'warning' });
const info = (code: ReasonCode, message: string): Reason => ({ code, message, severity: 'info' });

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
