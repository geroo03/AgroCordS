import { describe, expect, it } from "vitest";
import { calcularConsultasRestantes, LIMITE_GRATIS_DIARIO } from "../lib/chat/limite";

describe("calcularConsultasRestantes", () => {
  it("sin uso guardado, hay disponibles todas las consultas del día", () => {
    expect(calcularConsultasRestantes(0, null, "2026-09-12", false)).toBe(LIMITE_GRATIS_DIARIO);
  });

  it("descuenta las consultas ya hechas hoy", () => {
    expect(calcularConsultasRestantes(3, "2026-09-12", "2026-09-12", false)).toBe(
      LIMITE_GRATIS_DIARIO - 3,
    );
  });

  it("un día distinto al guardado reinicia el contador", () => {
    expect(calcularConsultasRestantes(5, "2026-09-11", "2026-09-12", false)).toBe(
      LIMITE_GRATIS_DIARIO,
    );
  });

  it("nunca baja de cero aunque el guardado exceda el límite", () => {
    expect(calcularConsultasRestantes(9, "2026-09-12", "2026-09-12", false)).toBe(0);
  });

  it("premium no tiene límite, sin importar el uso guardado", () => {
    expect(calcularConsultasRestantes(50, "2026-09-12", "2026-09-12", true)).toBe(Infinity);
  });
});
