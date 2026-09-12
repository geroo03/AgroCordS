import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchHourlyConditions, WeatherUnavailableError } from "@/lib/openmeteo";
import { assessSeries, findWindows } from "@/lib/spray-engine";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  productType: z.enum(["sistemico", "contacto"]).default("sistemico"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const { lat, lng, productType } = parsed.data;

  try {
    const conditions = await fetchHourlyConditions({ latitude: lat, longitude: lng });
    const hours = assessSeries(conditions, productType);
    // Prefijo en hora LOCAL del servidor, no UTC: el pronóstico viene en hora
    // local del lote y en la demo servidor y lote comparten zona horaria.
    const ahora = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const nowPrefix = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(
      ahora.getDate(),
    )}T${pad(ahora.getHours())}`;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      timezone: "auto",
      productType,
      current: hours.find((h) => h.time.slice(0, 13) >= nowPrefix) ?? null,
      hours,
      // Sólo horas desde ahora: una ventana pasada no es una recomendación.
      windows: findWindows(hours.filter((h) => h.time.slice(0, 13) >= nowPrefix)),
    });
  } catch (err) {
    if (err instanceof WeatherUnavailableError) {
      // 503, no 500: el problema es de un tercero y se resuelve reintentando.
      return NextResponse.json(
        { error: "El servicio de pronóstico no responde. Reintentá en unos minutos." },
        { status: 503 },
      );
    }
    throw err;
  }
}
