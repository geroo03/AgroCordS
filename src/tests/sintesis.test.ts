import { describe, expect, it } from "vitest";
import type { RiesgoHelada } from "../lib/helada";
import type { ObservacionSatelital } from "../lib/satelital/tipos";
import type { HourAssessment, HourlyConditions } from "../lib/spray-engine";
import {
  sintetizar,
  type EntradaSintesis,
  type Hallazgo,
} from "../lib/sintesis";

const condiciones: HourlyConditions = {
  time: "2026-09-12T15:00",
  temperatureC: 22,
  relativeHumidityPct: 60,
  windSpeedKmh: 9,
  windGustsKmh: 14,
  precipitationMm: 0,
  cloudCoverPct: 30,
  isDay: true,
};

const horaFavorable: HourAssessment = {
  time: "2026-09-12T15:00",
  suitability: "optima",
  score: 100,
  deltaT: 5.2,
  inversionRisk: false,
  reasons: [{ code: "CONDICIONES_OPTIMAS", message: "Condiciones adecuadas.", severity: "info" }],
  conditions: condiciones,
};

const horaBloqueada: HourAssessment = {
  ...horaFavorable,
  suitability: "no_recomendada",
  score: 0,
  reasons: [
    { code: "VIENTO_EXCESIVO", message: "Viento de 24 km/h.", severity: "blocker" },
  ],
};

const heladaTranquila = (): RiesgoHelada[] =>
  Array.from({ length: 72 }, (_, i) => ({
    time: `2026-09-12T${String(i % 24).padStart(2, "0")}:00`,
    temperaturaCanopeoC: 8,
    enRiesgo: false,
    razon: "sin ajuste",
  }));

const obs = (
  fecha: string,
  ndvi: number | null,
  ndre: number | null = ndvi === null ? null : ndvi * 0.6,
): ObservacionSatelital => ({
  fecha,
  ndvi,
  ndre,
  coberturaNubesPct: 0,
  confianza: ndvi === null ? "nula" : "alta",
});

const base: EntradaSintesis = {
  cultivo: "Soja",
  actual: horaFavorable,
  ventanas: [],
  helada: heladaTranquila(),
  agua: null,
  vigor: null,
};

const buscar = (hallazgos: readonly Hallazgo[], categoria: string) =>
  hallazgos.find((h) => h.categoria === categoria)!;

describe("sintetizar", () => {
  it("sin ningún dato devuelve sin_datos, no una conclusión inventada", () => {
    const d = sintetizar({
      cultivo: null,
      actual: null,
      ventanas: [],
      helada: [],
      agua: null,
      vigor: null,
    });
    expect(d.estado).toBe("sin_datos");
    expect(d.hallazgos.every((h) => h.estado === "sin_datos")).toBe(true);
  });

  it("cada categoría sin datos explica el motivo en vez de callarse", () => {
    const d = sintetizar(base);
    const agua = buscar(d.hallazgos, "agua");
    expect(agua.estado).toBe("sin_datos");
    expect(agua.interpretacion).toContain("fecha de siembra");
    expect(buscar(d.hallazgos, "cultivo").interpretacion).toContain("no se consultó");
  });

  it("una helada inminente manda el diagnóstico a riesgo", () => {
    const helada = heladaTranquila();
    helada[3] = { ...helada[3], temperaturaCanopeoC: -2.5, enRiesgo: true };
    const d = sintetizar({ ...base, helada });
    expect(d.estado).toBe("riesgo");
    expect(buscar(d.hallazgos, "clima").estado).toBe("riesgo");
    expect(d.titular).toContain("helada");
  });

  it("una helada recién a las 48 h es atención, no riesgo inminente", () => {
    const helada = heladaTranquila();
    helada[50] = { ...helada[50], temperaturaCanopeoC: -2.5, enRiesgo: true };
    expect(buscar(sintetizar({ ...base, helada }).hallazgos, "clima").estado).toBe(
      "atencion",
    );
  });

  it("no poder aplicar es atención, no riesgo: es operativo, no daña el lote", () => {
    const d = sintetizar({ ...base, actual: horaBloqueada });
    const aplicacion = buscar(d.hallazgos, "aplicacion");
    expect(aplicacion.estado).toBe("atencion");
    expect(aplicacion.interpretacion).toContain("limitación operativa");
  });

  it("clasifica el agotamiento hídrico por umbral y describe la tendencia", () => {
    const alto = sintetizar({ ...base, agua: { indiceHoy: 0.75, indicePrevio: 0.6 } });
    expect(buscar(alto.hallazgos, "agua").estado).toBe("riesgo");
    expect(buscar(alto.hallazgos, "agua").interpretacion).toContain("en aumento");

    const comodo = sintetizar({ ...base, agua: { indiceHoy: 0.2, indicePrevio: 0.22 } });
    const hallazgo = buscar(comodo.hallazgos, "agua");
    expect(hallazgo.estado).toBe("favorable");
    expect(hallazgo.interpretacion).toContain("estable");
    expect(hallazgo.aEvaluar).toBeNull();
  });

  it("una sola pasada satelital útil no alcanza para hablar de tendencia", () => {
    const d = sintetizar({ ...base, vigor: [obs("2026-09-01", 0.7), obs("2026-09-06", null)] });
    const cultivo = buscar(d.hallazgos, "cultivo");
    expect(cultivo.estado).toBe("sin_datos");
    expect(cultivo.interpretacion).toContain("dos pasadas");
  });

  it("detecta divergencia entre NDVI y NDRE con el vigor sostenido", () => {
    const d = sintetizar({
      ...base,
      vigor: [obs("2026-09-01", 0.7, 0.42), obs("2026-09-06", 0.71, 0.28)],
    });
    const cultivo = buscar(d.hallazgos, "cultivo");
    expect(cultivo.estado).toBe("atencion");
    expect(cultivo.titular).toContain("señales distintas");
  });

  it("cruza agua y vigor: dos señales en el mismo sentido refuerzan la lectura", () => {
    const d = sintetizar({
      ...base,
      agua: { indiceHoy: 0.64, indicePrevio: 0.5 },
      vigor: [obs("2026-09-01", 0.72), obs("2026-09-06", 0.6)],
    });
    const agua = buscar(d.hallazgos, "agua");
    expect(agua.titular).toBe("El lote presenta aumento del estrés hídrico");
    expect(agua.interpretacion).toContain("las dos señales apuntan en el mismo sentido");
    // La evidencia del hallazgo cruzado incluye la de las dos categorías.
    expect(agua.evidencia.some((e) => e.etiqueta === "NDVI")).toBe(true);
    expect(agua.evidencia.some((e) => e.etiqueta === "Índice de agotamiento")).toBe(true);
  });

  it("no cruza cuando el agua mejora aunque el vigor caiga", () => {
    const d = sintetizar({
      ...base,
      agua: { indiceHoy: 0.55, indicePrevio: 0.7 },
      vigor: [obs("2026-09-01", 0.72), obs("2026-09-06", 0.6)],
    });
    expect(buscar(d.hallazgos, "agua").titular).toBe("Aumento del estrés hídrico");
  });

  it("ordena los hallazgos de más severo a menos", () => {
    const helada = heladaTranquila();
    helada[2] = { ...helada[2], temperaturaCanopeoC: -3, enRiesgo: true };
    const d = sintetizar({ ...base, helada, agua: { indiceHoy: 0.1, indicePrevio: 0.1 } });
    const pesos = { riesgo: 3, atencion: 2, favorable: 1, sin_datos: 0 } as const;
    const secuencia = d.hallazgos.map((h) => pesos[h.estado]);
    expect([...secuencia].sort((a, b) => b - a)).toEqual(secuencia);
  });

  it("señala de qué hallazgo salió el titular, para no repetirlo en pantalla", () => {
    const helada = heladaTranquila();
    helada[2] = { ...helada[2], temperaturaCanopeoC: -3, enRiesgo: true };
    const d = sintetizar({ ...base, helada });
    expect(d.principal).toBe("clima");
    // El titular general contiene el del hallazgo: si la UI mostrara los dos,
    // el usuario leería la misma frase dos veces.
    const origen = d.hallazgos.find((h) => h.categoria === d.principal)!;
    expect(d.titular.startsWith(origen.titular)).toBe(true);
  });

  it("un titular que resume varias categorías no proviene de ninguna", () => {
    const d = sintetizar({ ...base, agua: { indiceHoy: 0.2, indicePrevio: 0.2 } });
    expect(d.titular).toBe("Sin señales de alerta en el lote");
    // No es el titular de ningún bloque, así que no hay nada que ocultar.
    expect(d.principal).toBeNull();
  });

  it("todo en orden da un titular sin alarma", () => {
    const d = sintetizar({ ...base, agua: { indiceHoy: 0.2, indicePrevio: 0.2 } });
    expect(d.estado).toBe("favorable");
    expect(d.titular).toBe("Sin señales de alerta en el lote");
  });

  it("ninguna acción sugerida instruye aplicar: sólo propone evaluar", () => {
    const escenarios = [
      sintetizar({ ...base, agua: { indiceHoy: 0.8, indicePrevio: 0.6 } }),
      sintetizar({ ...base, actual: horaBloqueada, ventanas: [] }),
      sintetizar({
        ...base,
        vigor: [obs("2026-09-01", 0.72), obs("2026-09-06", 0.6)],
      }),
    ];
    for (const d of escenarios) {
      for (const h of d.hallazgos) {
        if (h.aEvaluar === null) continue;
        expect(h.aEvaluar.toLowerCase()).toContain("evaluar");
        expect(h.aEvaluar).not.toMatch(/\baplicá\b|\bregá\b|\bsembrá\b/i);
      }
    }
  });
});
