import { describe, expect, it } from "vitest";
import { construirContextoLote, contextoATexto } from "../lib/chat/contexto";
import type { Diagnostico } from "../lib/sintesis";
import type { HourAssessment } from "../lib/spray-engine";
import type { Aplicacion } from "../lib/tipos";

const lote = { nombre: "La Esperanza", cultivo: "Soja", areaHa: 45.2 };

function diagnostico(overrides: Partial<Diagnostico> = {}): Diagnostico {
  return {
    estado: "favorable",
    titular: "Condiciones favorables para aplicar ahora",
    principal: "aplicacion",
    hallazgos: [
      {
        categoria: "aplicacion",
        estado: "favorable",
        titular: "Condiciones favorables para aplicar ahora",
        interpretacion: "Viento y Delta-T dentro de los rangos de referencia.",
        aEvaluar: null,
        evidencia: [{ etiqueta: "Viento", valor: "9 km/h" }],
      },
      {
        categoria: "clima",
        estado: "sin_datos",
        titular: "Sin datos suficientes",
        interpretacion: "No hay pronóstico horario disponible para este lote.",
        aEvaluar: null,
        evidencia: [],
      },
    ],
    ...overrides,
  };
}

function assessment(): HourAssessment {
  return {
    time: "2026-09-12T15:00",
    suitability: "optima",
    score: 90,
    deltaT: 5,
    inversionRisk: false,
    reasons: [],
    conditions: {
      time: "2026-09-12T15:00",
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

function aplicacion(id: string, fecha: string): Aplicacion {
  return {
    id,
    loteId: "lote-1",
    productoNombre: "Roundup Full II",
    tipoProducto: "sistemico",
    aplicadaEn: fecha,
    condiciones: assessment(),
    notas: null,
  };
}

describe("construirContextoLote", () => {
  it("arma el contexto con lote, diagnóstico, valor y aplicaciones recortadas a 5", () => {
    const aplicaciones = Array.from({ length: 8 }, (_, i) =>
      aplicacion(`ap-${i}`, `2026-09-0${(i % 9) + 1}T12:00:00.000Z`),
    );
    const ctx = construirContextoLote(
      lote,
      diagnostico(),
      { tipo: "aplicacion_eficiente", montoArs: 0, mensaje: "Sin pérdida de eficiencia estimada." },
      aplicaciones,
    );

    expect(ctx.lote).toEqual(lote);
    expect(ctx.diagnostico.titular).toBe("Condiciones favorables para aplicar ahora");
    expect(ctx.valorEconomico).toEqual({ mensaje: "Sin pérdida de eficiencia estimada." });
    expect(ctx.aplicacionesRecientes).toHaveLength(5);
    expect(ctx.aplicacionesRecientes[0]).toEqual({
      productoNombre: "Roundup Full II",
      tipoProducto: "sistemico",
      aplicadaEn: "2026-09-01T12:00:00.000Z",
      suitability: "optima",
    });
  });

  it("sin aplicaciones ni valor económico, los campos quedan vacíos/null, nunca inventados", () => {
    const ctx = construirContextoLote(lote, diagnostico(), null, []);
    expect(ctx.valorEconomico).toBeNull();
    expect(ctx.aplicacionesRecientes).toEqual([]);
  });
});

describe("contextoATexto", () => {
  it("incluye el lote, cada hallazgo con su categoría y evidencia", () => {
    const texto = contextoATexto(construirContextoLote(lote, diagnostico(), null, []));
    expect(texto).toContain("Lote: La Esperanza");
    expect(texto).toContain("Cultivo: Soja");
    expect(texto).toContain("[aplicacion]");
    expect(texto).toContain("Viento 9 km/h");
    expect(texto).toContain("No hay aplicaciones registradas todavía en este lote.");
  });

  it("dice explícitamente cuando un hallazgo no tiene datos, no lo omite", () => {
    const texto = contextoATexto(construirContextoLote(lote, diagnostico(), null, []));
    expect(texto).toContain("[clima]");
    expect(texto).toContain("No hay pronóstico horario disponible para este lote.");
  });

  it("agrega la línea de a evaluar sólo cuando el hallazgo la tiene", () => {
    const conAccion = diagnostico({
      hallazgos: [
        {
          categoria: "clima",
          estado: "riesgo",
          titular: "Riesgo de helada dentro de las 72 h",
          interpretacion: "Se estiman 3 h bajo el umbral de daño.",
          aEvaluar: "Conviene evaluar medidas de protección.",
          evidencia: [],
        },
      ],
    });
    const texto = contextoATexto(construirContextoLote(lote, conAccion, null, []));
    expect(texto).toContain("A evaluar: Conviene evaluar medidas de protección.");
  });

  it("no incluye la línea de valor económico cuando es null", () => {
    const texto = contextoATexto(construirContextoLote(lote, diagnostico(), null, []));
    expect(texto).not.toContain("Valor económico");
  });
});
