import { cultivoODefecto } from "./cultivo";
import type { DiaHistorico } from "./historico";

export const UMBRALES_GDD = {
  soja: { tBaseC: 10, techoC: 30 },
  maiz: { tBaseC: 10, techoC: 30 },
  trigo: { tBaseC: 0, techoC: 26 },
} as const;

export const AGUA_UTIL_MAX_MM = 175;

function umbralParaCultivo(cultivo: string | null) {
  return UMBRALES_GDD[cultivoODefecto(cultivo)];
}

export function calcularGddAcumulado(
  dias: DiaHistorico[],
  cultivo: string | null,
): number {
  const { tBaseC, techoC } = umbralParaCultivo(cultivo);
  return dias.reduce((total, dia) => {
    const tMax = Math.min(Math.max(dia.tMaxC, tBaseC), techoC);
    const tMin = Math.min(Math.max(dia.tMinC, tBaseC), techoC);
    return total + Math.max(0, (tMax + tMin) / 2 - tBaseC);
  }, 0);
}

export function calcularIndiceAgotamiento(dias: DiaHistorico[], kc: number): number {
  // Kc fijo aproxima la etapa de mayor demanda; no modela toda la fenología.
  let reserva = AGUA_UTIL_MAX_MM;
  for (const dia of dias) {
    reserva = Math.min(
      AGUA_UTIL_MAX_MM,
      Math.max(0, reserva + dia.precipitacionMm - dia.et0Mm * kc),
    );
  }
  return 1 - reserva / AGUA_UTIL_MAX_MM;
}