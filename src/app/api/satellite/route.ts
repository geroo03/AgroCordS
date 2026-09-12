import { NextResponse } from "next/server";
import { medirPoligono } from "@/lib/geo";
import { obtenerSerieSatelital } from "@/lib/satelital";
import { DEFAULT_MAX_CLOUD_COVERAGE } from "@/lib/satelital/config";
import { AREA_MAXIMA_HA, ConsultaSatelitalSchema } from "@/lib/satelital/validacion";

/**
 * GET /api/satellite?polygon=<GeoJSON Polygon en JSON>&from=AAAA-MM-DD&to=AAAA-MM-DD[&maxCloudCoverage=30]
 *
 * Devuelve una `SerieSatelital`. Nunca falla por el proveedor: si Sentinel
 * Hub no está configurado o no responde, la serie vuelve con `real: false`
 * y `fuente: "demo"`. Sólo los parámetros inválidos producen 400.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ConsultaSatelitalSchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parámetros inválidos" },
      { status: 400 },
    );
  }

  const { polygon, from, to, maxCloudCoverage } = parsed.data;

  if (medirPoligono(polygon).areaHa > AREA_MAXIMA_HA) {
    return NextResponse.json(
      { error: `El lote supera el área máxima admitida para esta consulta (${AREA_MAXIMA_HA} ha).` },
      { status: 400 },
    );
  }

  const serie = await obtenerSerieSatelital({
    polygon,
    desde: from,
    hasta: to,
    coberturaNubesMax: maxCloudCoverage ?? DEFAULT_MAX_CLOUD_COVERAGE,
  });

  return NextResponse.json(serie);
}
