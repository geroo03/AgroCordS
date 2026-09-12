"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DetalleHora from "@/components/decision/DetalleHora";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import BotonSesion from "@/components/ui/BotonSesion";
import Vacio from "@/components/ui/Vacio";
import { listarLotes, listarTodasLasAplicaciones } from "@/lib/almacen";
import { fechaHoraLegible } from "@/lib/formato";
import type { Aplicacion, Lote } from "@/lib/tipos";

export default function PaginaHistorialGlobal() {
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[] | null>(null);
  const [lotes, setLotes] = useState<Map<string, Lote>>(new Map());

  useEffect(() => {
    setAplicaciones(listarTodasLasAplicaciones());
    setLotes(new Map(listarLotes().map((l) => [l.id, l])));
  }, []);

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-8">
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
        <h1 className="mt-1 text-[32px] font-extrabold tracking-tight text-tinta">Historial</h1>
        <p className="text-[18px] leading-snug text-[#444651]">
          Todas las aplicaciones registradas, con las condiciones congeladas de cada una.
        </p>
      </header>

      {aplicaciones === null ? (
        <ul className="space-y-3">
          {[0, 1].map((i) => (
            <li key={i} className="shadow-sunken h-20 animate-pulse rounded-xl bg-[#f2f3ff]" />
          ))}
        </ul>
      ) : aplicaciones.length === 0 ? (
        <div className="space-y-3">
          <Vacio>
            Todavía no registraste aplicaciones. Se registran desde la pantalla de cada
            lote, con las condiciones del momento.
          </Vacio>
          <Link href="/lotes" className="block font-semibold text-pizarra underline">
            Ir a tus lotes
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {aplicaciones.map((a) => {
            const lote = lotes.get(a.loteId) ?? null;
            return (
              <li key={a.id}>
                <details className="shadow-extruded group rounded-xl bg-white p-3">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
                    {lote ? (
                      <MiniaturaLote lote={lote} className="shadow-sunken h-14 w-14 rounded-lg" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[18px] font-bold tracking-tight text-tinta">
                        {a.productoNombre}
                      </span>
                      <span className="block text-[15px] text-[#444651]">
                        {lote ? `${lote.nombre} · ` : ""}
                        {fechaHoraLegible(a.aplicadaEn)} ·{" "}
                        {a.tipoProducto === "sistemico" ? "sistémico" : "contacto"}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="material-symbols-outlined shrink-0 text-[#757682] transition-transform group-open:rotate-180"
                    >
                      expand_more
                    </span>
                  </summary>
                  <div className="mt-3 border-t border-[#e2e7ff] pt-3">
                    <p className="mb-3 text-[16px] text-tinta/70">
                      Condiciones congeladas al momento del registro:
                    </p>
                    <DetalleHora hora={a.condiciones} />
                    {a.notas ? (
                      <p className="mt-3 text-[18px]">
                        <span className="font-semibold">Notas:</span> {a.notas}
                      </p>
                    ) : null}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
