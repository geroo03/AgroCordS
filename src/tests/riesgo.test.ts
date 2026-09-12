import { describe, expect, it } from "vitest";
import type { HourAssessment, Suitability } from "../lib/spray-engine";
import { calcularScoreManejo, estimarValorDecision } from "../lib/riesgo";
import type { ObservacionSatelital } from "../lib/satelital/tipos";
import type { Aplicacion } from "../lib/tipos";

function assessment(suitability: Suitability, score: number): HourAssessment {
  return {
    time: "2026-09-11T15:00",
    suitability,
    score,
    deltaT: 5,
    inversionRisk: false,
    reasons: [],
    conditions: {
      time: "2026-09-11T15:00",
      temperatureC: 22,
      relativeHumidityPct: 60,
      windSpeedKmh: 9,
      windGustsKmh: 14,
      precipitationMm: 0,
      cloudCoverPct: 30,
      isDay: true,
    },
  };
}

function aplicacion(suitability: Suitability): Aplicacion {
  return {
    id: crypto.randomUUID(),
    loteId: "lote-1",
    productoNombre: "Producto de prueba",
    tipoProducto: "sistemico",
    aplicadaEn: "2026-09-01T12:00:00.000Z",
    condiciones: assessment(suitability, 80),
    notas: null,
  };
}

function observacion(fecha: string, ndvi: number | null): ObservacionSatelital {
  return {
    fecha,
    ndvi,
    ndre: ndvi !== null ? ndvi * 0.5 : null,
    coberturaNubesPct: 0,
    confianza: ndvi !== null ? "alta" : "nula",
    variabilidad: null,
  };
}

describe("estimarValorDecision", () => {
  it("bloqueado por el motor → pérdida evitada por el costo total del lote", () => {
    const v = estimarValorDecision(assessment("no_recomendada", 0), null, 10, 1000);
    expect(v?.tipo).toBe("perdida_evitada");
    expect(v?.montoArs).toBe(10_000);
  });

  it("hora actual muy por debajo de la mejor ventana → pérdida proporcional", () => {
    const mejorVentana = {
      startTime: "2026-09-12T08:00",
      endTime: "2026-09-12T10:00",
      hours: 2,
      averageScore: 90,
      bestSuitability: "optima" as Suitability,
    };
    const v = estimarValorDecision(assessment("aceptable", 50), mejorVentana, 10, 1000);
    expect(v?.tipo).toBe("perdida_evitada");
    // (90-50)/100 * 10.000 = 4.000
    expect(v?.montoArs).toBe(4000);
  });

  it("hora actual cerca de la mejor ventana → aplicación eficiente, sin pérdida", () => {
    const mejorVentana = {
      startTime: "2026-09-12T08:00",
      endTime: "2026-09-12T10:00",
      hours: 2,
      averageScore: 88,
      bestSuitability: "optima" as Suitability,
    };
    const v = estimarValorDecision(assessment("optima", 85), mejorVentana, 10, 1000);
    expect(v?.tipo).toBe("aplicacion_eficiente");
    expect(v?.montoArs).toBe(0);
  });

  it("sin hora actual → null", () => {
    expect(estimarValorDecision(null, null, 10)).toBeNull();
  });
});

describe("calcularScoreManejo", () => {
  it("sin aplicaciones ni vigor → no confiable", () => {
    const r = calcularScoreManejo([], []);
    expect(r.confiable).toBe(false);
  });

  it("todas las aplicaciones en buenas condiciones → score por encima del neutral", () => {
    const r = calcularScoreManejo(
      [aplicacion("optima"), aplicacion("optima"), aplicacion("aceptable")],
      [],
    );
    expect(r.confiable).toBe(true);
    expect(r.score).toBeGreaterThan(50);
    expect(r.banda).not.toBe("bajo");
  });

  it("todas las aplicaciones en malas condiciones → score por debajo del neutral", () => {
    const r = calcularScoreManejo(
      [aplicacion("no_recomendada"), aplicacion("marginal"), aplicacion("no_recomendada")],
      [],
    );
    expect(r.confiable).toBe(true);
    expect(r.score).toBeLessThan(50);
  });

  it("vigor estable suma puntos; vigor muy variable resta", () => {
    const estable = calcularScoreManejo(
      [],
      [observacion("2026-08-01", 0.6), observacion("2026-08-10", 0.61), observacion("2026-08-20", 0.59)],
    );
    const inestable = calcularScoreManejo(
      [],
      [observacion("2026-08-01", 0.8), observacion("2026-08-10", 0.2), observacion("2026-08-20", 0.75)],
    );
    expect(estable.score).toBeGreaterThan(inestable.score);
  });

  it("observaciones nubladas (ndvi null) se ignoran, no rompen el cálculo", () => {
    const r = calcularScoreManejo(
      [],
      [observacion("2026-08-01", null), observacion("2026-08-10", null)],
    );
    expect(r.confiable).toBe(false);
  });

  it("score siempre queda dentro de 0-100", () => {
    const r = calcularScoreManejo(
      [aplicacion("optima"), aplicacion("optima"), aplicacion("optima")],
      [observacion("2026-08-01", 0.6), observacion("2026-08-10", 0.6)],
    );
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
