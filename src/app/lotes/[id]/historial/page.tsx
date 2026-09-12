"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DetalleHora from "@/components/decision/DetalleHora";
import SubNavLote from "@/components/ui/SubNavLote";
import Vacio from "@/components/ui/Vacio";
import { listarAplicaciones, obtenerLote } from "@/lib/almacen";
import { fechaHoraLegible, hectareas } from "@/lib/formato";
import type { Aplicacion, Lote } from "@/lib/tipos";

export default function PaginaHistorial() {
  const params = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null | "no_encontrado">(null);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);

  useEffect(() => {
    setLote(obtenerLote(params.id) ?? "no_encontrado");
    setAplicaciones(listarAplicaciones(params.id));
  }, [params.id]);

  if (lote === "no_encontrado") {
    return (
      <div className="px-5 py-8">
        <Vacio>Este lote no existe en este dispositivo.</Vacio>
        <Link href="/lotes" className="mt-4 block font-semibold text-pizarra underline">
          Volver a tus lotes
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-8">
      <header className="sticky top-0 z-30 -mx-4 flex flex-col gap-2 bg-fondo/95 px-4 pt-2 pb-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link
            href={lote ? `/lotes/${lote.id}` : "/lotes"}
            className="shadow-extruded-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaedff] text-pizarra active:scale-95"
          >
            <span className="material-symbols-outlined text-[25px]">arrow_back</span>
          </Link>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-[#444651]">
              {lote ? `${lote.nombre} · ${hectareas(lote.areaHa)}` : "Volver"}
            </span>
            <h1 className="text-[28px] font-extrabold tracking-tight text-tinta">
              Historial de aplicaciones
            </h1>
          </div>
        </div>
        {lote ? <SubNavLote loteId={lote.id} /> : null}
      </header>

      {aplicaciones.length === 0 ? (
        <Vacio>Todavía no registraste aplicaciones en este lote.</Vacio>
      ) : (
        <ul className="space-y-3">
          {aplicaciones.map((a) => (
            <li key={a.id}>
              <details className="shadow-extruded group rounded-xl bg-white p-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2">
                  <span>
                    <span className="block text-[18px] font-bold text-tinta">
                      {a.productoNombre}
                    </span>
                    <span className="block text-[16px] text-[#444651]">
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
                <div className="mt-4 border-t border-[#e2e7ff] pt-4">
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
          ))}
        </ul>
      )}
    </div>
  );
}
