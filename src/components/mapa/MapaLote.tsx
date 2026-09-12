"use client";

import type { Polygon } from "geojson";
import { MapContainer, Polygon as PoligonoMapa, TileLayer } from "react-leaflet";
import DibujarLote from "./DibujarLote";

export interface PoligonoExistente {
  id: string;
  posiciones: [number, number][];
}

interface Props {
  centro: [number, number];
  zoom?: number;
  altoClase?: string;
  poligonos?: PoligonoExistente[];
  onPoligono?: (geometry: Polygon) => void;
}

export default function MapaLote({
  centro,
  zoom = 14,
  altoClase = "h-[420px]",
  poligonos = [],
  onPoligono,
}: Props) {
  return (
    <div className={`${altoClase} w-full overflow-hidden rounded-xl border border-niebla`}>
      <MapContainer center={centro} zoom={zoom} className="h-full w-full">
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Imágenes: Esri, Maxar, Earthstar Geographics"
          maxZoom={18}
        />
        {poligonos.map((p) => (
          <PoligonoMapa
            key={p.id}
            positions={p.posiciones}
            pathOptions={{ color: "#2a4a5c", weight: 2, fillOpacity: 0.15 }}
          />
        ))}
        {onPoligono ? <DibujarLote onPoligono={onPoligono} /> : null}
      </MapContainer>
    </div>
  );
}
