"use client";

import type { Polygon } from "geojson";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EstadoPunto from "@/components/decision/EstadoPunto";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import Boton from "@/components/ui/Boton";
import BotonSesion from "@/components/ui/BotonSesion";
import Campo from "@/components/ui/Campo";
import Vacio from "@/components/ui/Vacio";
import { cargarLotesDemo, guardarLote, listarLotes } from "@/lib/almacen";
import { hectareas } from "@/lib/formato";
import { medirPoligono, posicionesLeaflet, validarPoligono } from "@/lib/geo";
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

  useEffect(() => {
    setLotes(listarLotes());
  }, []);

  const alPoligono = useCallback((geometry: Polygon) => {
    const error = validarPoligono(geometry);
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
    <div className="flex flex-col gap-5 px-4 pt-3 pb-8">
      <header className="shadow-extruded flex flex-col gap-1 rounded-xl bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pizarra" aria-hidden />
            <span className="text-[14px] font-bold tracking-wider text-pizarra uppercase">
              Ventana de Aplicación
            </span>
          </div>
          <BotonSesion />
        </div>
        <h1 className="mt-1 text-[32px] font-extrabold tracking-tight text-tinta">Tus lotes</h1>
        <p className="text-[18px] leading-snug text-[#444651]">
          Elegí un lote para ver si se puede aplicar, o dibujá uno nuevo sobre el mapa.
        </p>
      </header>

      {lotes === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="shadow-sunken h-16 animate-pulse rounded-xl bg-[#f2f3ff]" />
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
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lotes.map((lote) => (
            <li key={lote.id}>
              <Link
                href={`/lotes/${lote.id}`}
                className="shadow-extruded flex h-full min-h-16 items-center gap-3 rounded-xl bg-white p-3 transition-transform active:scale-[0.99]"
              >
                <MiniaturaLote lote={lote} className="shadow-sunken h-16 w-16 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[18px] font-bold tracking-tight text-tinta">
                    {lote.nombre}
                  </span>
                  <span className="block text-[15px] text-[#444651]">
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

      <section className="shadow-extruded flex flex-col gap-3 rounded-xl bg-white p-4">
        <h2 className="text-[19px] font-bold tracking-widest text-pizarra uppercase">
          Dibujar un lote nuevo
        </h2>
        <div className="shadow-sunken overflow-hidden rounded-xl">
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
        </div>
        {errorPoligono ? (
          <p role="alert" className="text-[18px] font-medium text-bloqueo">
            {errorPoligono}
          </p>
        ) : null}
        {borrador ? (
          <div className="shadow-sunken flex flex-col gap-3 rounded-xl bg-[#f4f6fa] p-4">
            <p className="text-[18px] font-bold text-pizarra">
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

      <footer className="px-1 text-[14px] leading-snug text-tinta/60">
        Datos meteorológicos de{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">
          Open-Meteo.com
        </a>{" "}
        (CC BY 4.0).
      </footer>
    </div>
  );
}
