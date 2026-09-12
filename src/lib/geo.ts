import area from "@turf/area";
import centroid from "@turf/centroid";
import intersect from "@turf/intersect";
import kinks from "@turf/kinks";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export const AREA_MINIMA_HA = 0.5;
/**
 * Por encima de esto casi siempre se dibujó el establecimiento entero, no un
 * lote. La capa satelital tiene su propio tope para la consulta a Sentinel
 * Hub; este es el del alta de lotes.
 */
export const AREA_MAXIMA_HA = 5000;
/**
 * Fracción de superficie compartida con un lote ya cargado a partir de la
 * cual se rechaza el polígono: casi siempre es el mismo lote dibujado dos
 * veces. Se mide en las dos direcciones (ver `validarSolapamiento`).
 */
export const SOLAPAMIENTO_MAXIMO = 0.1;

export const MENSAJE_POLIGONO_INVALIDO =
  "El lote dibujado es demasiado chico. Volvé a marcarlo.";
export const MENSAJE_POLIGONO_CRUZADO =
  "El polígono se cruza a sí mismo. Volvé a dibujarlo sin que los lados se toquen.";
export const MENSAJE_POLIGONO_GRANDE =
  "El lote es demasiado grande para cargarlo como un polígono. Dividilo en lotes más chicos.";

export function mensajeSolapamiento(nombreLote: string): string {
  const pct = Math.round(SOLAPAMIENTO_MAXIMO * 100);
  return `Este polígono se superpone en más de un ${pct}% con "${nombreLote}". Revisá si no es el mismo lote dibujado dos veces.`;
}

export interface MedidasLote {
  centroidLat: number;
  centroidLng: number;
  areaHa: number;
}

/** Lo mínimo que hace falta de un lote ya cargado para compararlo con uno nuevo. */
export interface LoteExistente {
  readonly nombre: string;
  readonly geometry: Polygon;
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
  // Un polígono que se cruza a sí mismo no tiene un área que signifique
  // nada: se chequea antes que el tamaño.
  if (kinks(geometry).features.length > 0) return MENSAJE_POLIGONO_CRUZADO;
  const { areaHa } = medirPoligono(geometry);
  if (areaHa < AREA_MINIMA_HA) return MENSAJE_POLIGONO_INVALIDO;
  if (areaHa > AREA_MAXIMA_HA) return MENSAJE_POLIGONO_GRANDE;
  return null;
}

/**
 * Rechaza el polígono si pisa demasiado a un lote ya cargado. Se compara la
 * superficie compartida contra el polígono nuevo Y contra el existente: si
 * sólo se mirara el nuevo, un polígono enorme que se traga entero a un lote
 * chico pasaría con un porcentaje mínimo.
 * Devuelve el mensaje de error, o null si no hay solapamiento relevante.
 */
export function validarSolapamiento(
  geometry: Polygon,
  existentes: readonly LoteExistente[],
): string | null {
  const areaNueva = area(aFeature(geometry));
  if (areaNueva <= 0) return null;

  for (const lote of existentes) {
    const areaExistente = area(aFeature(lote.geometry));
    if (areaExistente <= 0) continue;
    const comun = areaComun(geometry, lote.geometry);
    const fraccion = Math.max(comun / areaNueva, comun / areaExistente);
    if (fraccion > SOLAPAMIENTO_MAXIMO) return mensajeSolapamiento(lote.nombre);
  }
  return null;
}

/** Superficie compartida entre dos polígonos, en m². */
function areaComun(a: Polygon, b: Polygon): number {
  const coleccion: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: [aFeature(a), aFeature(b)],
  };
  let comun: Feature<Polygon | MultiPolygon> | null;
  try {
    comun = intersect(coleccion);
  } catch {
    // Geometría degenerada guardada antes de estas validaciones: no se
    // bloquea al usuario por un lote viejo que ya no se puede recortar.
    return 0;
  }
  return comun ? area(comun) : 0;
}

/** GeoJSON guarda [lng, lat]; Leaflet dibuja [lat, lng]. */
export function posicionesLeaflet(geometry: Polygon): [number, number][] {
  return (geometry.coordinates[0] ?? []).map(([lng, lat]) => [lat, lng]);
}
