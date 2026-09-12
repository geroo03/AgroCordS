import { describe, expect, it } from "vitest";
import {
  AGUA_UTIL_MAX_MM,
  calcularGddAcumulado,
  calcularIndiceAgotamiento,
} from "../lib/agronomico";
import type { DiaHistorico } from "../lib/historico";

const dia = (extra: Partial<DiaHistorico>): DiaHistorico => ({
  fecha: "2026-05-01",
  tMaxC: 20,
  tMinC: 10,
  precipitacionMm: 0,
  et0Mm: 0,
  ...extra,
});

describe("agronomico", () => {
  it("calcula GDD normales", () => {
    expect(calcularGddAcumulado([dia({ tMaxC: 20, tMinC: 10 })], "soja")).toBe(5);
  });

  it("aplica el techo individualmente", () => {
    expect(calcularGddAcumulado([dia({ tMaxC: 38, tMinC: 20 })], "maiz")).toBe(20);
  });

  it("mantiene bajo el agotamiento con lluvia abundante", () => {
    const dias = [dia({ precipitacionMm: 100, et0Mm: 5 })];
    expect(calcularIndiceAgotamiento(dias, 0.8)).toBe(0);
  });

  it("acota el agotamiento durante una sequía sostenida", () => {
    const dias = Array.from({ length: 100 }, () => dia({ et0Mm: 10 }));
    const indice = calcularIndiceAgotamiento(dias, 1);
    expect(indice).toBe(1);
    expect(indice).toBeLessThanOrEqual(AGUA_UTIL_MAX_MM / AGUA_UTIL_MAX_MM);
  });
});