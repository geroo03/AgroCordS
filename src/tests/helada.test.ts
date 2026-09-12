import { describe, expect, it } from "vitest";
import { evaluarHelada } from "../lib/helada";
import type { HourlyConditions } from "../lib/spray-engine";

const hora = (extra: Partial<HourlyConditions>): HourlyConditions => ({
  time: "2026-09-12T03:00",
  temperatureC: -1,
  relativeHumidityPct: 80,
  windSpeedKmh: 2,
  windGustsKmh: 4,
  precipitationMm: 0,
  cloudCoverPct: 10,
  isDay: false,
  ...extra,
});

describe("evaluarHelada", () => {
  it("ajusta una noche despejada y calma", () => {
    expect(evaluarHelada([hora({})], "soja")[0]).toMatchObject({
      temperaturaCanopeoC: -4,
      enRiesgo: true,
    });
  });

  it("no ajusta durante el día", () => {
    // Se comprueba que no se resten los 3 °C nocturnos, no que desaparezca el
    // riesgo: a -1 °C la soja se daña igual, sea de día o de noche.
    expect(evaluarHelada([hora({ isDay: true })], "soja")[0].temperaturaCanopeoC).toBe(-1);
  });

  it("no ajusta con nubosidad o viento", () => {
    expect(evaluarHelada([hora({ cloudCoverPct: 80 })], "soja")[0].temperaturaCanopeoC).toBe(-1);
    expect(evaluarHelada([hora({ windSpeedKmh: 10 })], "soja")[0].temperaturaCanopeoC).toBe(-1);
  });

  it("usa el umbral de trigo de -4°C", () => {
    expect(evaluarHelada([hora({ temperatureC: -1 })], "trigo")[0].enRiesgo).toBe(true);
    expect(evaluarHelada([hora({ temperatureC: 0 })], "trigo")[0].enRiesgo).toBe(false);
  });

  it("usa 0°C para cultivos desconocidos", () => {
    expect(evaluarHelada([hora({ temperatureC: 0 })], null)[0].enRiesgo).toBe(true);
  });
});