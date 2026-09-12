/**
 * Cliente de Open-Meteo.
 *
 * Única frontera con el exterior: acá se valida y se traduce al modelo de
 * dominio. Ninguna otra parte de la app conoce la forma de la respuesta de
 * Open-Meteo, así que cambiar de proveedor de clima toca sólo este archivo.
 *
 * Open-Meteo no requiere API key. Datos bajo CC BY 4.0: la atribución
 * "Weather data by Open-Meteo.com" debe estar visible en la UI.
 * El uso gratuito es para uso no comercial; al monetizar hay que pasar al
 * plan comercial o self-hostear.
 */

import { z } from 'zod';
import type { HourlyConditions } from './spray-engine';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'precipitation',
  'cloud_cover',
  'is_day',
] as const;

/**
 * `is_day` se valida como opcional y se resuelve con sunrise/sunset si no
 * viniera: no queremos que un cambio en la API deje la demo sin el cálculo de
 * inversión térmica, que depende de saber si es de noche.
 */
const ForecastResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number().nullable()),
    relative_humidity_2m: z.array(z.number().nullable()),
    wind_speed_10m: z.array(z.number().nullable()),
    wind_gusts_10m: z.array(z.number().nullable()),
    wind_direction_10m: z.array(z.number().nullable()).optional(),
    precipitation: z.array(z.number().nullable()),
    cloud_cover: z.array(z.number().nullable()),
    is_day: z.array(z.number().nullable()).optional(),
  }),
  daily: z
    .object({
      time: z.array(z.string()),
      sunrise: z.array(z.string()),
      sunset: z.array(z.string()),
    })
    .optional(),
});

export type ForecastResponse = z.infer<typeof ForecastResponseSchema>;

export class WeatherUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'WeatherUnavailableError';
  }
}

export interface ForecastOptions {
  readonly latitude: number;
  readonly longitude: number;
  readonly forecastDays?: number;
  readonly signal?: AbortSignal;
}

export async function fetchHourlyConditions({
  latitude,
  longitude,
  forecastDays = 3,
  signal,
}: ForecastOptions): Promise<HourlyConditions[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', latitude.toFixed(4));
  url.searchParams.set('longitude', longitude.toFixed(4));
  url.searchParams.set('hourly', HOURLY_VARS.join(','));
  url.searchParams.set('daily', 'sunrise,sunset');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', String(forecastDays));

  let raw: unknown;
  try {
    const res = await fetch(url, {
      signal,
      // Cache de 30 min: los modelos no se actualizan más seguido y esto nos
      // deja muy por debajo del límite de uso justo de Open-Meteo.
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      throw new WeatherUnavailableError(`Open-Meteo respondió ${res.status}`);
    }
    raw = await res.json();
  } catch (err) {
    if (err instanceof WeatherUnavailableError) throw err;
    throw new WeatherUnavailableError('No se pudo consultar el pronóstico', err);
  }

  const parsed = ForecastResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WeatherUnavailableError(
      `Respuesta de Open-Meteo con forma inesperada: ${parsed.error.issues[0]?.path.join('.')}`,
    );
  }

  return toDomain(parsed.data);
}

function toDomain(data: ForecastResponse): HourlyConditions[] {
  const h = data.hourly;
  const isDayAt = buildIsDayResolver(data);

  const out: HourlyConditions[] = [];

  for (let i = 0; i < h.time.length; i++) {
    const time = h.time[i];
    const temperatureC = h.temperature_2m[i];
    const relativeHumidityPct = h.relative_humidity_2m[i];
    const windSpeedKmh = h.wind_speed_10m[i];

    // Un hueco en cualquiera de las tres variables centrales hace que la hora
    // no sea evaluable. Preferimos omitirla antes que inventar un valor.
    if (temperatureC === null || relativeHumidityPct === null || windSpeedKmh === null) {
      continue;
    }

    out.push({
      time,
      temperatureC,
      relativeHumidityPct,
      windSpeedKmh,
      windGustsKmh: h.wind_gusts_10m[i] ?? windSpeedKmh,
      windDirectionDeg: h.wind_direction_10m?.[i] ?? undefined,
      precipitationMm: h.precipitation[i] ?? 0,
      cloudCoverPct: h.cloud_cover[i] ?? 50,
      isDay: isDayAt(i, time),
    });
  }

  return out;
}

function buildIsDayResolver(data: ForecastResponse): (index: number, time: string) => boolean {
  const flags = data.hourly.is_day;
  if (flags) {
    return (index) => flags[index] === 1;
  }

  const daily = data.daily;
  if (!daily) {
    // Último recurso: franja diurna aproximada.
    return (_index, time) => {
      const hour = Number(time.slice(11, 13));
      return hour >= 7 && hour < 20;
    };
  }

  const byDate = new Map<string, { sunrise: string; sunset: string }>();
  daily.time.forEach((date, i) => {
    byDate.set(date, { sunrise: daily.sunrise[i], sunset: daily.sunset[i] });
  });

  return (_index, time) => {
    const day = byDate.get(time.slice(0, 10));
    if (!day) return true;
    return time >= day.sunrise && time <= day.sunset;
  };
}
