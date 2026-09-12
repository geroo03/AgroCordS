"use client";

import { useMemo, useState } from "react";
import type { Lote } from "@/lib/tipos";

/**
 * Miniatura satelital estática del lote con su polígono dibujado encima.
 *
 * Usa el endpoint de exportación de imagen de Esri World Imagery (el mismo
 * proveedor de teselas del mapa interactivo) y superpone el polígono como SVG,
 * proyectado linealmente dentro del bbox: a escala de lote el error es
 * despreciable. Si la imagen no carga (sin red), queda el polígono sobre
 * fondo pizarra: la forma del lote siempre se ve.
 */

const EXPORT_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export";

const METROS_POR_GRADO_LAT = 111_320;

interface Encuadre {
  url: string;
  puntos: string;
}

function construirEncuadre(lote: Lote): Encuadre {
  const anillo = lote.geometry.coordinates[0] ?? [];
  let oeste = Infinity;
  let este = -Infinity;
  let sur = Infinity;
  let norte = -Infinity;
  for (const [lng, lat] of anillo) {
    oeste = Math.min(oeste, lng);
    este = Math.max(este, lng);
    sur = Math.min(sur, lat);
    norte = Math.max(norte, lat);
  }

  const latCentro = (sur + norte) / 2;
  const lngCentro = (oeste + este) / 2;
  const cosLat = Math.cos((latCentro * Math.PI) / 180);

  // Lado del encuadre en metros: el lote más un 60% de margen, mínimo 500 m.
  const anchoM = (este - oeste) * METROS_POR_GRADO_LAT * cosLat;
  const altoM = (norte - sur) * METROS_POR_GRADO_LAT;
  const ladoM = Math.max(Math.max(anchoM, altoM) * 1.6, 500);

  const mitadLat = ladoM / 2 / METROS_POR_GRADO_LAT;
  const mitadLng = ladoM / 2 / (METROS_POR_GRADO_LAT * cosLat);
  const bbox = {
    oeste: lngCentro - mitadLng,
    este: lngCentro + mitadLng,
    sur: latCentro - mitadLat,
    norte: latCentro + mitadLat,
  };

  const url = `${EXPORT_URL}?bbox=${bbox.oeste},${bbox.sur},${bbox.este},${bbox.norte}&bboxSR=4326&imageSR=4326&size=240,240&format=jpg&f=image`;

  const puntos = anillo
    .map(([lng, lat]) => {
      const x = ((lng - bbox.oeste) / (bbox.este - bbox.oeste)) * 100;
      const y = (1 - (lat - bbox.sur) / (bbox.norte - bbox.sur)) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return { url, puntos };
}

export default function MiniaturaLote({
  lote,
  className = "h-18 w-18",
}: {
  lote: Lote;
  className?: string;
}) {
  const [fallo, setFallo] = useState(false);
  const encuadre = useMemo(() => construirEncuadre(lote), [lote]);

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-lg border border-niebla bg-pizarra/80 ${className}`}
    >
      {!fallo ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagen externa de tamaño fijo; next/image no aporta acá
        <img
          src={encuadre.url}
          alt=""
          loading="lazy"
          onError={() => setFallo(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
        className="absolute inset-0 h-full w-full"
      >
        <polygon
          points={encuadre.puntos}
          fill="rgba(255,255,255,0.12)"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
