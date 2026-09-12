import { z } from "zod";

const BASE_URL = "https://archive-api.open-meteo.com/v1/archive";

const HistoricalResponseSchema = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
    precipitation_sum: z.array(z.number().nullable()),
    et0_fao_evapotranspiration: z.array(z.number().nullable()),
  }),
});

export interface DiaHistorico {
  fecha: string;
  tMaxC: number;
  tMinC: number;
  precipitacionMm: number;
  et0Mm: number;
}

export class HistoricoNoDisponibleError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "HistoricoNoDisponibleError";
  }
}

export async function fetchHistoricoDiario(opts: {
  latitude: number;
  longitude: number;
  desde: string;
  hasta: string;
}): Promise<DiaHistorico[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("latitude", opts.latitude.toFixed(4));
  url.searchParams.set("longitude", opts.longitude.toFixed(4));
  url.searchParams.set("start_date", opts.desde);
  url.searchParams.set("end_date", opts.hasta);
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration",
  );
  url.searchParams.set("timezone", "auto");

  let raw: unknown;
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new HistoricoNoDisponibleError(
        `Open-Meteo respondió ${response.status}`,
      );
    }
    raw = await response.json();
  } catch (error) {
    if (error instanceof HistoricoNoDisponibleError) throw error;
    throw new HistoricoNoDisponibleError(
      "No se pudo consultar el clima histórico",
      error,
    );
  }

  const parsed = HistoricalResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HistoricoNoDisponibleError(
      `Respuesta histórica con forma inesperada: ${parsed.error.issues[0]?.path.join(".")}`,
    );
  }

  const { daily } = parsed.data;
  const dias: DiaHistorico[] = [];
  for (let i = 0; i < daily.time.length; i++) {
    const tMaxC = daily.temperature_2m_max[i];
    const tMinC = daily.temperature_2m_min[i];
    const precipitacionMm = daily.precipitation_sum[i];
    const et0Mm = daily.et0_fao_evapotranspiration[i];
    if (
      tMaxC === null ||
      tMinC === null ||
      precipitacionMm === null ||
      et0Mm === null
    ) {
      continue;
    }
    dias.push({ fecha: daily.time[i], tMaxC, tMinC, precipitacionMm, et0Mm });
  }
  return dias;
}