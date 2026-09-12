"use client";

import "@geoman-io/leaflet-geoman-free";
import type * as L from "leaflet";
import type { Polygon } from "geojson";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

interface Props {
  onPoligono: (geometry: Polygon) => void;
}

/** Activa los controles de geoman y entrega el polígono dibujado como GeoJSON. */
export default function DibujarLote({ onPoligono }: Props) {
  const map = useMap();
  const ultimaCapa = useRef<L.Layer | null>(null);

  useEffect(() => {
    map.pm.setLang("es");
    map.pm.addControls({
      position: "topleft",
      drawPolygon: true,
      drawMarker: false,
      drawCircleMarker: false,
      drawCircle: false,
      drawPolyline: false,
      drawRectangle: false,
      drawText: false,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
    });
    // Herramienta de polígono activa por defecto: la pantalla vacía invita a dibujar.
    map.pm.enableDraw("Polygon", { snappable: false });

    const alCrear = (e: { layer: L.Layer }) => {
      ultimaCapa.current?.remove();
      ultimaCapa.current = e.layer;
      const geo = (e.layer as L.Polygon).toGeoJSON();
      if (geo.geometry.type === "Polygon") onPoligono(geo.geometry);
    };

    map.on("pm:create", alCrear as L.LeafletEventHandlerFn);
    return () => {
      map.off("pm:create", alCrear as L.LeafletEventHandlerFn);
      map.pm.disableDraw();
      map.pm.removeControls();
    };
  }, [map, onPoligono]);

  return null;
}
