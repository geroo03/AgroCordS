import { describe, expect, it } from "vitest";
import {
  clasificarEnso,
  parsearOni,
  TEMPORADAS_PARA_EPISODIO,
  type LecturaOni,
} from "../lib/enso";

/** Recorte textual del archivo del CPC, con su encabezado real. */
const ARCHIVO_CPC = `
 SEAS  YR   TOTAL   ANOM
  DJF 1950  25.01  -1.32
  JFM 1950  25.36  -1.20
  NDJ 2025  25.96  -0.60
  DJF 2026  26.15  -0.39
  JFM 2026  26.57  -0.21
  FMA 2026  27.34   0.11
  MAM 2026  28.09   0.46
  AMJ 2026  28.74   0.95
  MJJ 2026  29.02   1.39
  JJA 2026  29.09   1.80
`;

const serie = (...anomalias: number[]): LecturaOni[] =>
  anomalias.map((anomalia, i) => ({
    temporada: "JJA",
    anio: 2020 + i,
    anomalia,
  }));

describe("parsearOni", () => {
  it("descarta el encabezado y lee las filas de datos", () => {
    const lecturas = parsearOni(ARCHIVO_CPC);
    expect(lecturas).toHaveLength(10);
    expect(lecturas[0]).toEqual({ temporada: "DJF", anio: 1950, anomalia: -1.32 });
    expect(lecturas[lecturas.length - 1]).toEqual({
      temporada: "JJA",
      anio: 2026,
      anomalia: 1.8,
    });
  });

  it("no se cae con texto vacío o basura", () => {
    expect(parsearOni("")).toEqual([]);
    expect(parsearOni("no es el archivo\nesperado")).toEqual([]);
  });
});

describe("clasificarEnso", () => {
  it("sin lecturas no inventa una fase", () => {
    expect(clasificarEnso([])).toBeNull();
  });

  it("clasifica El Niño con su intensidad", () => {
    const e = clasificarEnso(parsearOni(ARCHIVO_CPC))!;
    expect(e.fase).toBe("el_nino");
    // 1,80 cae en la banda fuerte (1,5 a 1,9).
    expect(e.intensidad).toBe("fuerte");
    expect(e.ultima.anomalia).toBe(1.8);
  });

  it("clasifica La Niña por el umbral negativo", () => {
    const e = clasificarEnso(serie(0, -0.3, -0.8, -1.2))!;
    expect(e.fase).toBe("la_nina");
    expect(e.intensidad).toBe("moderado");
  });

  it("entre -0,5 y 0,5 la fase es neutral y no tiene intensidad", () => {
    const e = clasificarEnso(serie(0.1, 0.2, 0.3, 0.4))!;
    expect(e.fase).toBe("neutral");
    expect(e.intensidad).toBeNull();
  });

  it("no declara episodio sin las cinco temporadas que pide la NOAA", () => {
    // Tres consecutivas sobre el umbral: condiciones presentes, no episodio.
    const e = clasificarEnso(parsearOni(ARCHIVO_CPC))!;
    expect(e.episodioConfirmado).toBe(false);
  });

  it("declara episodio con cinco temporadas consecutivas", () => {
    const e = clasificarEnso(serie(0.2, 0.7, 0.9, 1.1, 1.3, 1.5, 1.6))!;
    expect(e.episodioConfirmado).toBe(true);
    expect(TEMPORADAS_PARA_EPISODIO).toBe(5);
  });

  it("una fase interrumpida corta la cuenta de consecutivas", () => {
    // Cuatro sobre el umbral, un bache neutral, y dos más: no llega a cinco.
    const e = clasificarEnso(serie(0.9, 1.0, 1.1, 1.2, 0.2, 0.8, 0.9))!;
    expect(e.fase).toBe("el_nino");
    expect(e.episodioConfirmado).toBe(false);
  });

  it("lee la tendencia contra tres temporadas atrás, no contra la anterior", () => {
    expect(clasificarEnso(serie(0.2, 0.5, 0.9, 1.4))!.tendencia).toBe("en_aumento");
    expect(clasificarEnso(serie(1.4, 0.9, 0.5, 0.2))!.tendencia).toBe("en_descenso");
    expect(clasificarEnso(serie(1.0, 1.1, 0.9, 1.05))!.tendencia).toBe("estable");
  });

  it("usa la magnitud para la intensidad, en las dos fases", () => {
    expect(clasificarEnso(serie(-2.3))!.intensidad).toBe("muy_fuerte");
    expect(clasificarEnso(serie(0.6))!.intensidad).toBe("debil");
  });
});
