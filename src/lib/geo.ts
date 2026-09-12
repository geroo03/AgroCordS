import area from "@turf/area";
import centroid from "@turf/centroid";
import type { Feature, Polygon } from "geojson";

export const AREA_MINIMA_HA = 0.5;
export const MENSAJE_POLIGONO_INVALIDO =
  "El lote dibujado es demasiado chico. Volvé a marcarlo.";

export interface MedidasLote {
  centroidLat: number;
  centroidLng: number;
  areaHa: number;
}

function aFeature(geometry: Polygon): Feature<Polygon> {
  return { type: "Feature", properties: {}, geometry };
}

export function medirPoligono(geometry: Polygon): MedidasLote {
  const f = aFeature(geometry);
  const [lng, lat] = centroid(f).geometry.coordinates;
  return {
    centroidLat: lat,
    centroidLng: lng,
    areaHa: Math.round((area(f) / 10_000) * 100) / 100,
  };
}

/** Devuelve el mensaje de error, o null si el polígono sirve como lote. */
export function validarPoligono(geometry: Polygon): string | null {
  const anillo = geometry.coordinates[0] ?? [];
  // El anillo GeoJSON repite el primer vértice al final.
  const vertices = anillo.length > 1 ? anillo.length - 1 : anillo.length;
  if (vertices < 4) return MENSAJE_POLIGONO_INVALIDO;
  if (medirPoligono(geometry).areaHa < AREA_MINIMA_HA) {
    return MENSAJE_POLIGONO_INVALIDO;
  }
  return null;
}

/** GeoJSON guarda [lng, lat]; Leaflet dibuja [lat, lng]. */
export function posicionesLeaflet(geometry: Polygon): [number, number][] {
  return (geometry.coordinates[0] ?? []).map(([lng, lat]) => [lat, lng]);
}
