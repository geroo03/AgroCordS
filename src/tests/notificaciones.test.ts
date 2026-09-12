import { describe, expect, it } from "vitest";
import { estaVentanaAbierta } from "../lib/notificaciones";
import type { SprayWindow } from "../lib/spray-engine";

const ventana: SprayWindow = {
  startTime: "2026-09-12T08:00",
  endTime: "2026-09-12T10:00",
  hours: 3,
  averageScore: 90,
  bestSuitability: "optima",
};

describe("estaVentanaAbierta", () => {
  it("hora dentro del rango (incluyendo el extremo final) → abierta", () => {
    expect(estaVentanaAbierta(ventana, "2026-09-12T09:00")).toBe(true);
    expect(estaVentanaAbierta(ventana, "2026-09-12T08:00")).toBe(true);
    expect(estaVentanaAbierta(ventana, "2026-09-12T10:00")).toBe(true);
  });

  it("hora antes o después del rango → cerrada", () => {
    expect(estaVentanaAbierta(ventana, "2026-09-12T07:00")).toBe(false);
    expect(estaVentanaAbierta(ventana, "2026-09-12T11:00")).toBe(false);
  });
});
