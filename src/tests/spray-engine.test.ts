import { describe, expect, it } from "vitest";
import {
  assessHour,
  assessSeries,
  findWindows,
  type HourlyConditions,
} from "../lib/spray-engine";

const base: HourlyConditions = {
  time: "2026-09-11T15:00",
  temperatureC: 22,
  relativeHumidityPct: 60,
  windSpeedKmh: 9,
  windGustsKmh: 14,
  precipitationMm: 0,
  cloudCoverPct: 30,
  isDay: true,
};

const con = (extra: Partial<HourlyConditions>): HourlyConditions => ({
  ...base,
  ...extra,
});

describe("spray-engine", () => {
  it("1. condiciones base → óptima", () => {
    const r = assessHour(base, []);
    expect(r.suitability).toBe("optima");
    expect(r.score).toBe(100);
  });

  it("2. viento 30 km/h → no_recomendada por VIENTO_EXCESIVO", () => {
    const r = assessHour(con({ windSpeedKmh: 30 }), []);
    expect(r.suitability).toBe("no_recomendada");
    expect(
      r.reasons.some((x) => x.code === "VIENTO_EXCESIVO" && x.severity === "blocker"),
    ).toBe(true);
  });

  it("3. viento 1 km/h → no_recomendada por VIENTO_INSUFICIENTE", () => {
    const r = assessHour(con({ windSpeedKmh: 1 }), []);
    expect(r.suitability).toBe("no_recomendada");
    expect(
      r.reasons.some(
        (x) => x.code === "VIENTO_INSUFICIENTE" && x.severity === "blocker",
      ),
    ).toBe(true);
  });

  it("4. 35 °C y 20% HR → Delta-T > 10 → no_recomendada", () => {
    const r = assessHour(con({ temperatureC: 35, relativeHumidityPct: 20 }), []);
    expect(r.deltaT).toBeGreaterThan(10);
    expect(r.suitability).toBe("no_recomendada");
    expect(r.reasons.some((x) => x.code === "DELTA_T_ALTO")).toBe(true);
  });

  it("5. noche calma y despejada → INVERSION_TERMICA", () => {
    const r = assessHour(
      con({ isDay: false, windSpeedKmh: 2, cloudCoverPct: 10 }),
      [],
    );
    expect(r.inversionRisk).toBe(true);
    expect(r.suitability).toBe("no_recomendada");
    expect(r.reasons.some((x) => x.code === "INVERSION_TERMICA")).toBe(true);
  });

  it("6. lluvia de 2 mm dentro de 2 h bloquea a un producto de contacto", () => {
    const upcoming = [
      con({ time: "2026-09-11T16:00" }),
      con({ time: "2026-09-11T17:00", precipitationMm: 2 }),
    ];
    const r = assessHour(base, upcoming, "contacto");
    expect(r.suitability).toBe("no_recomendada");
    expect(
      r.reasons.some((x) => x.code === "LLUVIA_PROXIMA" && x.severity === "blocker"),
    ).toBe(true);
  });

  it("7. la misma lluvia no bloquea a un sistémico", () => {
    const upcoming = [
      con({ time: "2026-09-11T16:00" }),
      con({ time: "2026-09-11T17:00", precipitationMm: 2 }),
    ];
    const r = assessHour(base, upcoming, "sistemico");
    expect(r.suitability).toBe("optima");
    expect(r.reasons.every((x) => x.code !== "LLUVIA_PROXIMA")).toBe(true);
  });

  it("8. una sola hora buena aislada no forma ventana", () => {
    const serie = [
      con({ time: "2026-09-11T14:00", windSpeedKmh: 30 }),
      con({ time: "2026-09-11T15:00" }),
      con({ time: "2026-09-11T16:00", windSpeedKmh: 30 }),
    ];
    const ventanas = findWindows(assessSeries(serie));
    expect(ventanas).toHaveLength(0);
  });
});
