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
    // 1°C: de noche con cielo despejado y calma el canopeo baja a -2°C (riesgo,
    // ≤ 0 para soja); de día no hay ajuste radiativo y queda en 1°C (sin
    // riesgo). Con -1°C (el valor por defecto de hora()) ya habría riesgo aun
    // sin ajuste, porque -1 ≤ 0: no serviría para probar que el ajuste es
    // exclusivamente nocturno.
    expect(evaluarHelada([hora({ temperatureC: 1 })], "soja")[0].enRiesgo).toBe(true);
    expect(evaluarHelada([hora({ temperatureC: 1, isDay: true })], "soja")[0].enRiesgo).toBe(false);
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