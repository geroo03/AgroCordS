/**
 * Capa de síntesis: convierte la salida de los motores en una conclusión.
 *
 * No calcula agronomía por su cuenta ni corrige a ningún motor. Lee lo que ya
 * produjeron `spray-engine`, `helada`, `agronomico` y la capa satelital, y
 * responde en el orden en que lo necesita quien abre la app: qué pasa, qué
 * cambió, qué conviene evaluar y con qué evidencia.
 *
 * Tres registros de lenguaje, separados a propósito — esa separación es la
 * razón de ser del módulo:
 *
 *   información     el dato medido, sin adjetivos.
 *                   "Se esperan mínimas de 0,8 °C."
 *   interpretación  qué sugiere ese dato para el cultivo declarado.
 *                   "Compatible con riesgo de helada para trigo."
 *   a evaluar       qué conviene mirar. NUNCA una instrucción de aplicar,
 *                   sembrar o regar: la decisión agronómica es del
 *                   profesional matriculado (Ley provincial 9164), igual
 *                   que en el veredicto de pulverización.
 *
 * Cuando falta el dato que sostendría una conclusión, la categoría se informa
 * como `sin_datos` con el motivo. Nunca se completa con un supuesto: una
 * conclusión construida sobre un hueco suena igual de segura que una apoyada
 * en evidencia, y por eso es peor que no concluir.
 */

import { rumboViento } from "./formato";
import type { RiesgoHelada } from "./helada";
import type { ObservacionSatelital } from "./satelital/tipos";
import type { HourAssessment, SprayWindow } from "./spray-engine";

export type EstadoSintesis = "favorable" | "atencion" | "riesgo" | "sin_datos";

export type CategoriaDecision = "aplicacion" | "agua" | "clima" | "cultivo";

export const ETIQUETA_CATEGORIA: Record<CategoriaDecision, string> = {
  aplicacion: "Aplicación",
  agua: "Agua y estrés",
  clima: "Riesgo climático",
  cultivo: "Estado del cultivo",
};

/** Un dato crudo que respalda un hallazgo: la "evidencia" del principio. */
export interface Evidencia {
  readonly etiqueta: string;
  readonly valor: string;
}

export interface Hallazgo {
  readonly categoria: CategoriaDecision;
  readonly estado: EstadoSintesis;
  /** Una línea: la conclusión de la categoría. */
  readonly titular: string;
  /** Qué significa para el lote; el motivo cuando el estado es `sin_datos`. */
  readonly interpretacion: string;
  /** Qué conviene evaluar. `null` cuando no hay nada que sugerir. */
  readonly aEvaluar: string | null;
  readonly evidencia: readonly Evidencia[];
}

export interface Diagnostico {
  /** El peor estado entre los hallazgos que sí tienen datos. */
  readonly estado: EstadoSintesis;
  readonly titular: string;
  /**
   * Categoría de la que salió `titular`, o `null` cuando el titular es un
   * resumen propio y no el de ningún hallazgo. La UI lo usa para no decir dos
   * veces lo mismo: el bloque que produjo el titular no lo repite.
   */
  readonly principal: CategoriaDecision | null;
  readonly hallazgos: readonly Hallazgo[];
}

/** Índice de agotamiento hoy y en la lectura previa, para leer la tendencia. */
export interface EntradaAgua {
  readonly indiceHoy: number;
  /** `null` cuando la serie es más corta que la ventana de comparación. */
  readonly indicePrevio: number | null;
}

export interface EntradaSintesis {
  readonly cultivo: string | null;
  readonly actual: HourAssessment | null;
  readonly ventanas: readonly SprayWindow[];
  readonly helada: readonly RiesgoHelada[];
  /** `null` cuando el lote no tiene fecha de siembra o falló el histórico. */
  readonly agua: EntradaAgua | null;
  /** `null` cuando no se consultó (sin Premium) o falló el proveedor. */
  readonly vigor: readonly ObservacionSatelital[] | null;
}

// ── Umbrales ─────────────────────────────────────────────────
//
// Orientativos y centralizados acá para que ajustarlos sea una sola edición,
// con el mismo criterio que `THRESHOLDS` en spray-engine. Un ingeniero
// agrónomo debe revisarlos antes de presentarlos como recomendación.

export const UMBRALES_SINTESIS = {
  agua: { riesgo: 0.7, atencion: 0.5, cambioRelevante: 0.05 },
  /** Variación de NDVI que deja de ser ruido entre dos pasadas. */
  vigor: { cambioRelevante: 0.05 },
  /**
   * Desvío del NDVI dentro del lote a partir del cual deja de ser un lote y
   * pasan a ser dos. Medido sobre lotes reales de la zona: un cultivo parejo
   * ronda 0,14 y un rastrojo uniforme 0,02, mientras que un lote partido
   * llega a 0,36.
   */
  desparejo: 0.2,
  /** Por debajo de esta relación NDRE/NDVI hay divergencia entre índices. */
  divergencia: 0.45,
  /** Horas dentro de las cuales una helada se considera inminente. */
  heladaInminenteH: 24,
} as const;

const PESO: Record<EstadoSintesis, number> = {
  sin_datos: 0,
  favorable: 1,
  atencion: 2,
  riesgo: 3,
};

// ── Entrada principal ────────────────────────────────────────

export function sintetizar(entrada: EntradaSintesis): Diagnostico {
  const hallazgos = cruzarAguaYVigor(
    [
      evaluarClima(entrada),
      evaluarAgua(entrada),
      evaluarCultivo(entrada),
      evaluarAplicacion(entrada),
    ],
    entrada,
  );

  // Primero lo más severo; dentro del mismo estado se mantiene el orden de
  // arriba, que va de la amenaza al cultivo hacia lo operativo.
  const ordenados = [...hallazgos].sort((a, b) => PESO[b.estado] - PESO[a.estado]);
  const conDatos = ordenados.filter((h) => h.estado !== "sin_datos");

  if (conDatos.length === 0) {
    return {
      estado: "sin_datos",
      titular: "Todavía no hay datos suficientes para una conclusión",
      principal: null,
      hallazgos: ordenados,
    };
  }

  const { titular, principal } = titularGeneral(conDatos);
  return { estado: conDatos[0].estado, titular, principal, hallazgos: ordenados };
}

function titularGeneral(conDatos: readonly Hallazgo[]): {
  titular: string;
  principal: CategoriaDecision | null;
} {
  const peor = conDatos[0];
  if (peor.estado === "favorable") {
    // Con varias categorías en verde el titular resume y no repite a ninguna,
    // así que no hay bloque del que provenga.
    return conDatos.length > 1
      ? { titular: "Sin señales de alerta en el lote", principal: null }
      : { titular: peor.titular, principal: peor.categoria };
  }
  const acompañan = conDatos.filter(
    (h) => h !== peor && h.estado === peor.estado,
  ).length;
  return {
    titular: acompañan > 0 ? `${peor.titular}, y algo más para mirar` : peor.titular,
    principal: peor.categoria,
  };
}

// ── Riesgo climático (helada) ────────────────────────────────

function evaluarClima(entrada: EntradaSintesis): Hallazgo {
  const { helada, cultivo } = entrada;
  if (helada.length === 0) {
    return sinDatos("clima", "No hay pronóstico horario disponible para este lote.");
  }

  const minima = helada.reduce(
    (min, h) => (h.temperaturaCanopeoC < min.temperaturaCanopeoC ? h : min),
    helada[0],
  );
  const evidencia: Evidencia[] = [
    {
      etiqueta: "Mínima estimada en canopeo",
      valor: `${minima.temperaturaCanopeoC.toFixed(1)} °C`,
    },
    { etiqueta: "Horas evaluadas", valor: String(helada.length) },
  ];

  const indicePrimerRiesgo = helada.findIndex((h) => h.enRiesgo);
  if (indicePrimerRiesgo < 0) {
    return {
      categoria: "clima",
      estado: "favorable",
      titular: "Sin riesgo de helada en las próximas 72 h",
      interpretacion: `La mínima estimada en el canopeo es de ${minima.temperaturaCanopeoC.toFixed(1)} °C, por encima del umbral de daño del cultivo declarado.`,
      aEvaluar: null,
      evidencia,
    };
  }

  const horasEnRiesgo = helada.filter((h) => h.enRiesgo).length;
  const primera = helada[indicePrimerRiesgo];
  const inminente = indicePrimerRiesgo < UMBRALES_SINTESIS.heladaInminenteH;
  const cultivoTexto = cultivo ? `para ${cultivo.toLowerCase()}` : "para el cultivo declarado";

  return {
    categoria: "clima",
    estado: inminente ? "riesgo" : "atencion",
    titular: inminente
      ? "Riesgo de helada en las próximas horas"
      : "Riesgo de helada dentro de las 72 h",
    interpretacion: `Se estiman ${horasEnRiesgo} h con temperatura de canopeo bajo el umbral de daño ${cultivoTexto}, la primera con ${primera.temperaturaCanopeoC.toFixed(1)} °C. El valor corrige la temperatura del pronóstico por enfriamiento radiativo: el canopeo se enfría más que la garita meteorológica.`,
    aEvaluar:
      "Conviene evaluar medidas de protección y un monitoreo del lote en la franja señalada.",
    evidencia: [
      ...evidencia,
      { etiqueta: "Horas bajo el umbral", valor: String(horasEnRiesgo) },
    ],
  };
}

// ── Agua y estrés ────────────────────────────────────────────

function evaluarAgua(entrada: EntradaSintesis): Hallazgo {
  const { agua } = entrada;
  if (!agua) {
    return sinDatos(
      "agua",
      "Hace falta la fecha de siembra del lote para calcular el balance hídrico.",
    );
  }

  const { indiceHoy, indicePrevio } = agua;
  const delta = indicePrevio === null ? null : indiceHoy - indicePrevio;
  const tendencia = describirTendencia(delta, UMBRALES_SINTESIS.agua.cambioRelevante);

  const evidencia: Evidencia[] = [
    { etiqueta: "Índice de agotamiento", valor: indiceHoy.toFixed(2) },
  ];
  if (delta !== null) {
    evidencia.push({
      etiqueta: "Cambio en la última semana",
      valor: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`,
    });
  }

  const estado: EstadoSintesis =
    indiceHoy >= UMBRALES_SINTESIS.agua.riesgo
      ? "riesgo"
      : indiceHoy >= UMBRALES_SINTESIS.agua.atencion
        ? "atencion"
        : "favorable";

  if (estado === "favorable") {
    return {
      categoria: "agua",
      estado,
      titular: "Reserva de agua en niveles cómodos",
      interpretacion: `El balance da un agotamiento de ${indiceHoy.toFixed(2)} sobre 1, ${tendencia}. El suelo todavía tiene margen antes de que el cultivo sienta restricción.`,
      aEvaluar: null,
      evidencia,
    };
  }

  return {
    categoria: "agua",
    estado,
    titular: estado === "riesgo" ? "Agotamiento hídrico alto" : "Aumento del estrés hídrico",
    interpretacion: `El agotamiento es de ${indiceHoy.toFixed(2)} sobre 1, ${tendencia}. ${
      estado === "riesgo"
        ? "En este rango el cultivo suele mostrar restricción por agua."
        : "Todavía no es crítico, pero la reserva viene cediendo."
    } El índice sale de un balance con agua útil supuesta, no de una medición del suelo de este lote.`,
    aEvaluar:
      "Conviene evaluar la disponibilidad hídrica del lote y seguir la evolución en los próximos días.",
    evidencia,
  };
}

function describirTendencia(delta: number | null, umbral: number): string {
  if (delta === null) return "sin una lectura previa con la que comparar";
  if (delta > umbral) return "en aumento respecto de la semana pasada";
  if (delta < -umbral) return "en descenso respecto de la semana pasada";
  return "estable respecto de la semana pasada";
}

// ── Estado del cultivo (NDVI / NDRE) ─────────────────────────

function evaluarCultivo(entrada: EntradaSintesis): Hallazgo {
  const { vigor } = entrada;
  if (vigor === null) {
    return sinDatos("cultivo", "El vigor satelital no se consultó para este lote.");
  }

  const confiables = vigor.filter((o) => o.ndvi !== null);
  if (confiables.length < 2) {
    return sinDatos(
      "cultivo",
      "Sentinel-2 no dejó al menos dos pasadas con suficiente lote despejado: no alcanza para leer una tendencia.",
    );
  }

  const ultima = confiables[confiables.length - 1];
  const previa = confiables[confiables.length - 2];
  const ndviHoy = ultima.ndvi as number;
  const delta = ndviHoy - (previa.ndvi as number);
  const tendencia = describirTendencia(delta, UMBRALES_SINTESIS.vigor.cambioRelevante);

  const evidencia: Evidencia[] = [
    { etiqueta: "NDVI", valor: ndviHoy.toFixed(2) },
    {
      etiqueta: "Cambio vs. pasada anterior",
      valor: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`,
    },
    { etiqueta: "Observación", valor: ultima.fecha },
  ];
  if (ultima.ndre !== null) {
    evidencia.push({ etiqueta: "NDRE", valor: ultima.ndre.toFixed(2) });
  }

  const v = ultima.variabilidad;
  const desparejo = v !== null && v.desvio > UMBRALES_SINTESIS.desparejo;
  if (v !== null) {
    evidencia.push(
      { etiqueta: "Dispersión dentro del lote", valor: v.desvio.toFixed(2) },
      { etiqueta: "Décimo peor / mejor", valor: `${v.p10.toFixed(2)} — ${v.p90.toFixed(2)}` },
    );
  }

  // Un lote partido se informa aunque el promedio se vea bien: es la única
  // lectura que dice POR DÓNDE caminar, y el promedio no la deja ver.
  if (desparejo && v !== null) {
    return {
      categoria: "cultivo",
      estado: "atencion",
      titular: "El lote está desparejo por dentro",
      interpretacion: `El promedio de NDVI es ${ndviHoy.toFixed(2)}, pero el décimo peor del lote está en ${v.p10.toFixed(2)} y el décimo mejor en ${v.p90.toFixed(2)}: no hay un sector que valga el promedio. ${
        delta < -UMBRALES_SINTESIS.vigor.cambioRelevante
          ? "Además viene cayendo entre pasadas."
          : "La diferencia puede venir del suelo, de la implantación o de un problema localizado."
      }`,
      aEvaluar:
        "Conviene recorrer el lote comparando el sector de menor vigor con el resto, antes de decidir un manejo uniforme.",
      evidencia,
    };
  }

  const divergencia =
    ultima.ndre !== null &&
    ndviHoy > 0 &&
    ultima.ndre / ndviHoy < UMBRALES_SINTESIS.divergencia;

  if (delta < -UMBRALES_SINTESIS.vigor.cambioRelevante) {
    return {
      categoria: "cultivo",
      estado: "atencion",
      titular: "El vigor vegetativo viene cayendo",
      interpretacion: `El NDVI bajó ${Math.abs(delta).toFixed(2)} entre las dos últimas pasadas útiles, hasta ${ndviHoy.toFixed(2)}.${
        divergencia
          ? " Además el NDRE queda muy por debajo del NDVI, algo que suele acompañar un estrés que el NDVI todavía no muestra."
          : ""
      } El índice no dice la causa: puede ser agua, nutrición, sanidad o el propio avance del ciclo.`,
      aEvaluar:
        "Si el deterioro sigue en la próxima pasada, conviene evaluar una recorrida a campo para determinar la causa.",
      evidencia,
    };
  }

  if (divergencia) {
    return {
      categoria: "cultivo",
      estado: "atencion",
      titular: "NDVI y NDRE muestran señales distintas",
      interpretacion: `El NDVI se sostiene en ${ndviHoy.toFixed(2)} pero el NDRE queda muy por debajo. En canopeo cerrado el NDVI se satura y deja de distinguir variación, mientras el borde rojo sigue siendo sensible a clorofila y nitrógeno.`,
      aEvaluar: "Conviene evaluar el estado nutricional del lote.",
      evidencia,
    };
  }

  return {
    categoria: "cultivo",
    estado: "favorable",
    titular: "Vigor vegetativo sin deterioro",
    interpretacion: `El NDVI está en ${ndviHoy.toFixed(2)}, ${tendencia}, y el NDRE acompaña sin divergencia.`,
    aEvaluar: null,
    evidencia,
  };
}

// ── Aplicación (lee spray-engine, no lo recalcula) ───────────

function evaluarAplicacion(entrada: EntradaSintesis): Hallazgo {
  const { actual, ventanas } = entrada;
  if (!actual) {
    return sinDatos("aplicacion", "No hay pronóstico para la hora actual.");
  }

  const favorable =
    actual.suitability === "optima" || actual.suitability === "aceptable";
  const bloqueo = actual.reasons.find((r) => r.severity === "blocker");
  const hayVentana = ventanas.length > 0;

  const direccion =
    actual.conditions.windDirectionDeg !== undefined
      ? rumboViento(actual.conditions.windDirectionDeg)
      : null;

  const evidencia: Evidencia[] = [
    { etiqueta: "Delta-T", valor: actual.deltaT.toLocaleString("es-AR") },
    { etiqueta: "Viento", valor: `${Math.round(actual.conditions.windSpeedKmh)} km/h` },
    { etiqueta: "Ráfagas", valor: `${Math.round(actual.conditions.windGustsKmh)} km/h` },
    { etiqueta: "Humedad", valor: `${Math.round(actual.conditions.relativeHumidityPct)} %` },
  ];
  if (direccion) {
    evidencia.splice(2, 0, {
      etiqueta: "Deriva hacia",
      valor: `el ${direccion.hacia}`,
    });
  }

  if (favorable) {
    return {
      categoria: "aplicacion",
      estado: "favorable",
      titular: "Condiciones favorables para aplicar ahora",
      interpretacion:
        "Viento, Delta-T y la ventana libre de lluvia están dentro de los rangos de referencia para el tipo de producto elegido.",
      aEvaluar: hayVentana
        ? "La ventana en curso es de las mejores de las próximas 72 h; conviene evaluar aprovecharla."
        : null,
      evidencia,
    };
  }

  return {
    categoria: "aplicacion",
    // Una limitación operativa, no una amenaza al cultivo: el rojo se reserva
    // para lo que daña el lote, como la helada.
    estado: "atencion",
    titular: "Ahora no hay condiciones para aplicar",
    interpretacion: `${
      bloqueo
        ? `${bloqueo.message} Es una limitación operativa, no un riesgo para el cultivo.`
        : "Las condiciones actuales quedan fuera de los rangos de referencia."
    }${
      hayVentana
        ? ""
        : " Tampoco se detectan ventanas de al menos 2 h seguidas en las próximas 72 h."
    }`,
    aEvaluar: hayVentana
      ? "Conviene evaluar la próxima ventana recomendada más abajo en vez de aplicar ahora."
      : null,
    evidencia,
  };
}

// ── Señal cruzada: agua + vigor ──────────────────────────────

/**
 * El caso que justifica toda la capa: agua y vigor por separado pueden verse
 * tolerables y, juntos, contar otra cosa. Cuando la reserva cede y el vigor
 * cae en la misma ventana, las dos señales apuntan al mismo lado y la
 * conclusión sube de tono — sin inventar un dato nuevo, sólo leyendo dos que
 * ya estaban ahí por separado.
 */
function cruzarAguaYVigor(
  hallazgos: readonly Hallazgo[],
  entrada: EntradaSintesis,
): Hallazgo[] {
  const agua = hallazgos.find((h) => h.categoria === "agua");
  const cultivo = hallazgos.find((h) => h.categoria === "cultivo");
  if (!agua || !cultivo || agua.estado === "sin_datos") return [...hallazgos];

  const aguaCediendo =
    entrada.agua !== null &&
    entrada.agua.indicePrevio !== null &&
    entrada.agua.indiceHoy - entrada.agua.indicePrevio >
      UMBRALES_SINTESIS.agua.cambioRelevante;
  const vigorCayendo = cultivo.titular === "El vigor vegetativo viene cayendo";

  if (!aguaCediendo || !vigorCayendo) return [...hallazgos];

  const reforzado: Hallazgo = {
    ...agua,
    estado: agua.estado === "riesgo" ? "riesgo" : "atencion",
    titular: "El lote presenta aumento del estrés hídrico",
    interpretacion: `${agua.interpretacion} En la misma ventana el vigor vegetativo viene cayendo: las dos señales apuntan en el mismo sentido, lo que refuerza la lectura de restricción por agua frente a otras causas posibles.`,
    aEvaluar:
      "Conviene monitorear el lote y revisar la disponibilidad hídrica. Si el deterioro del vigor continúa, evaluar una inspección presencial para determinar la causa.",
    evidencia: [...agua.evidencia, ...cultivo.evidencia],
  };

  return hallazgos.map((h) => (h.categoria === "agua" ? reforzado : h));
}

// ── Helpers ──────────────────────────────────────────────────

function sinDatos(categoria: CategoriaDecision, motivo: string): Hallazgo {
  return {
    categoria,
    estado: "sin_datos",
    titular: "Sin datos suficientes",
    interpretacion: motivo,
    aEvaluar: null,
    evidencia: [],
  };
}
