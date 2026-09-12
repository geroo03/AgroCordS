"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DetalleHora from "@/components/decision/DetalleHora";
import MiniaturaLote from "@/components/mapa/MiniaturaLote";
import Vacio from "@/components/ui/Vacio";
import { listarLotes, listarTodasLasAplicaciones } from "@/lib/almacen";
import { fechaHoraLegible } from "@/lib/formato";
import type { Aplicacion, Lote } from "@/lib/tipos";

export default function PaginaHistorialGlobal() {
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[] | null>(null);
  const [lotes, setLotes] = useState<Map<string, Lote>>(new Map());

  useEffect(() => {
    listarTodasLasAplicaciones().then(setAplicaciones);
    listarLotes().then((ls) => setLotes(new Map(ls.map((l) => [l.id, l]))));
  }, []);

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-24">
      <header className="clay-elevado rounded-2xl p-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-tinta">Historial</h1>
        <p className="mt-1 text-base text-tinta/70">
          Todas las aplicaciones registradas, con las condiciones congeladas de cada una.
        </p>
      </header>

      {aplicaciones === null ? (
        <ul className="space-y-3">
          {[0, 1].map((i) => (
            <li key={i} className="clay-hundido h-20 animate-pulse rounded-2xl" />
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
        <ul className="space-y-3">
          {aplicaciones.map((a) => {
            const lote = lotes.get(a.loteId) ?? null;
            return (
              <li key={a.id}>
                <details className="clay-elevado rounded-2xl p-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
                    {lote ? <MiniaturaLote lote={lote} className="h-14 w-14" /> : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold">
                        {a.productoNombre}
                      </span>
                      <span className="block text-sm text-tinta/70">
                        {lote ? `${lote.nombre} · ` : ""}
                        {fechaHoraLegible(a.aplicadaEn)} ·{" "}
                        {a.tipoProducto === "sistemico" ? "sistémico" : "contacto"}
                      </span>
                    </span>
                    <span aria-hidden className="text-tinta/50">
                      ▾
                    </span>
                  </summary>
                  <div className="mt-3 border-t border-niebla pt-3">
                    <p className="mb-3 text-sm text-tinta/70">
                      Condiciones congeladas al momento del registro:
                    </p>
                    <DetalleHora hora={a.condiciones} />
                    {a.notas ? (
                      <p className="mt-3 text-base">
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
