"use client";

import type { Polygon } from "geojson";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import EstadoPunto from "@/components/decision/EstadoPunto";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import Boton from "@/components/ui/Boton";
import Campo from "@/components/ui/Campo";
import Vacio from "@/components/ui/Vacio";
import { cargarLotesDemo, guardarLote, listarLotes } from "@/lib/almacen";
import { hectareas } from "@/lib/formato";
import {
  medirPoligono,
  posicionesLeaflet,
  validarPoligono,
  validarSolapamiento,
} from "@/lib/geo";
import type { Lote } from "@/lib/tipos";

const MapaLote = dynamic(() => import("@/components/mapa/MapaLote"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-xl bg-niebla" />,
});

const CENTRO_INICIAL: [number, number] = [-32.7, -62.1];

interface Borrador {
  geometry: Polygon;
  areaHa: number;
}

export default function PaginaLotes() {
  const [lotes, setLotes] = useState<Lote[] | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [errorPoligono, setErrorPoligono] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [cultivo, setCultivo] = useState("");

  // Los lotes se leen desde un ref para que `alPoligono` conserve su
  // identidad: si cambiara, el mapa reinicializaría los controles de dibujo.
  const lotesRef = useRef<Lote[]>([]);

  useEffect(() => {
    setLotes(listarLotes());
  }, []);

  useEffect(() => {
    lotesRef.current = lotes ?? [];
  }, [lotes]);

  const alPoligono = useCallback((geometry: Polygon) => {
    const error =
      validarPoligono(geometry) ?? validarSolapamiento(geometry, lotesRef.current);
    if (error) {
      setErrorPoligono(error);
      setBorrador(null);
      return;
    }
    setErrorPoligono(null);
    setBorrador({ geometry, areaHa: medirPoligono(geometry).areaHa });
  }, []);

  const guardar = () => {
    if (!borrador || nombre.trim().length === 0) return;
    guardarLote({
      nombre: nombre.trim().slice(0, 80),
      cultivo: cultivo.trim() ? cultivo.trim().slice(0, 40) : null,
      geometry: borrador.geometry,
    });
    setLotes(listarLotes());
    setBorrador(null);
    setNombre("");
    setCultivo("");
  };

  return (
    <div className="px-5 pb-16">
      <header className="py-5">
        <h1 className="text-2xl font-extrabold">Tus lotes</h1>
        <p className="mt-1 text-base text-tinta/70">
          Elegí un lote para ver si se puede aplicar, o dibujá uno nuevo sobre el mapa.
        </p>
      </header>

      {lotes === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-niebla" />
          ))}
        </div>
      ) : lotes.length === 0 ? (
        <div className="space-y-3">
          <Vacio>
            Todavía no cargaste ningún lote. Dibujá el primero sobre el mapa: tocá el
            mapa para marcar los vértices y cerrá el polígono en el primer punto.
          </Vacio>
          <Boton variante="secundario" onClick={() => setLotes(cargarLotesDemo())}>
            Cargar 3 lotes de ejemplo (Córdoba)
          </Boton>
        </div>
      ) : (
        <ul className="space-y-2">
          {lotes.map((lote) => (
            <li key={lote.id}>
              <Link
                href={`/lotes/${lote.id}`}
                className="flex min-h-16 items-center gap-3 rounded-xl border border-niebla p-3"
              >
                <MiniaturaLote lote={lote} className="h-18 w-18" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold">{lote.nombre}</span>
                  <span className="block text-sm text-tinta/70">
                    {lote.cultivo ? `${lote.cultivo} · ` : ""}
                    {hectareas(lote.areaHa)}
                  </span>
                </span>
                <EstadoPunto lat={lote.centroidLat} lng={lote.centroidLng} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-bold">Dibujar un lote nuevo</h2>
        <MapaLote
          centro={
            lotes && lotes.length > 0
              ? [lotes[0].centroidLat, lotes[0].centroidLng]
              : CENTRO_INICIAL
          }
          zoom={13}
          poligonos={(lotes ?? []).map((l) => ({
            id: l.id,
            posiciones: posicionesLeaflet(l.geometry),
          }))}
          onPoligono={alPoligono}
        />
        {errorPoligono ? (
          <p role="alert" className="mt-2 text-base font-medium text-bloqueo">
            {errorPoligono}
          </p>
        ) : null}
        {borrador ? (
          <div className="mt-3 space-y-3 rounded-xl border border-niebla p-4">
            <p className="text-base font-bold">
              Lote dibujado: {hectareas(borrador.areaHa)}
            </p>
            <Campo
              etiqueta="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej.: Lote 7"
              maxLength={80}
            />
            <Campo
              etiqueta="Cultivo (opcional)"
              value={cultivo}
              onChange={(e) => setCultivo(e.target.value)}
              placeholder="Ej.: Soja"
              maxLength={40}
            />
            <div className="flex gap-2">
              <Boton onClick={guardar} disabled={nombre.trim().length === 0}>
                Guardar lote
              </Boton>
              <Boton variante="secundario" onClick={() => setBorrador(null)}>
                Cancelar
              </Boton>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="mt-8 text-xs leading-snug text-tinta/60">
        Datos meteorológicos de{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">
          Open-Meteo.com
        </a>{" "}
        (CC BY 4.0).
      </footer>
    </div>
  );
}
