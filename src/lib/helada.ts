import type { HourlyConditions } from "./spray-engine";

const UMBRAL_SOJA_MAIZ_C = 0;
const UMBRAL_TRIGO_C = -4;
const AJUSTE_RADIATIVO_C = 3;

export interface RiesgoHelada {
  time: string;
  temperaturaCanopeoC: number;
  enRiesgo: boolean;
  razon: string;
}

function umbralParaCultivo(cultivo: string | null): number {
  const normalizado = cultivo
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return normalizado === "trigo" ? UMBRAL_TRIGO_C : UMBRAL_SOJA_MAIZ_C;
}

export function evaluarHelada(
  hours: HourlyConditions[],
  cultivo: string | null,
): RiesgoHelada[] {
  const umbral = umbralParaCultivo(cultivo);
  return hours.map((hour) => {
    const enfriamientoRadiativo =
      !hour.isDay && hour.cloudCoverPct < 30 && hour.windSpeedKmh < 8;
    const temperaturaCanopeoC =
      hour.temperatureC - (enfriamientoRadiativo ? AJUSTE_RADIATIVO_C : 0);
    const enRiesgo = temperaturaCanopeoC <= umbral;
    const condicion = enfriamientoRadiativo
      ? "cielo despejado y viento calmo"
      : "sin ajuste radiativo";
    const razon = `Temperatura de canopeo estimada en ${temperaturaCanopeoC.toFixed(1)}°C con ${condicion}; umbral ${umbral}°C.`;
    return { time: hour.time, temperaturaCanopeoC, enRiesgo, razon };
  });
}

export function hayRiesgoHelada(riesgos: RiesgoHelada[]): boolean {
  return riesgos.some((riesgo) => riesgo.enRiesgo);
}