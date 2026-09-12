"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DetalleHora from "@/components/decision/DetalleHora";
import Vacio from "@/components/ui/Vacio";
import { listarAplicaciones, obtenerLote } from "@/lib/almacen";
import { fechaHoraLegible, hectareas } from "@/lib/formato";
import type { Aplicacion, Lote } from "@/lib/tipos";

export default function PaginaHistorial() {
  const params = useParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null | "no_encontrado">(null);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);

  useEffect(() => {
    let vigente = true;
    obtenerLote(params.id).then((l) => {
      if (vigente) setLote(l ?? "no_encontrado");
    });
    listarAplicaciones(params.id).then((a) => {
      if (vigente) setAplicaciones(a);
    });
    return () => {
      vigente = false;
    };
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
    <div className="px-5 pb-16">
      <header className="border-b border-niebla py-3">
        <Link
          href={lote ? `/lotes/${lote.id}` : "/lotes"}
          className="flex min-h-11 items-center gap-2 font-semibold text-pizarra"
        >
          <span aria-hidden>←</span>
          <span>{lote ? `${lote.nombre} · ${hectareas(lote.areaHa)}` : "Volver"}</span>
        </Link>
        <h1 className="text-2xl font-extrabold">Historial de aplicaciones</h1>
      </header>

      <div className="mt-4">
        {aplicaciones.length === 0 ? (
          <Vacio>Todavía no registraste aplicaciones en este lote.</Vacio>
        ) : (
          <ul className="space-y-2">
            {aplicaciones.map((a) => (
              <li key={a.id}>
                <details className="rounded-xl border border-niebla p-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2">
                    <span>
                      <span className="block text-base font-bold">{a.productoNombre}</span>
                      <span className="block text-sm text-tinta/70">
                        {fechaHoraLegible(a.aplicadaEn)} ·{" "}
                        {a.tipoProducto === "sistemico" ? "sistémico" : "contacto"}
                      </span>
                    </span>
                    <span aria-hidden className="text-tinta/50">
                      ▾
                    </span>
                  </summary>
                  <div className="mt-4 border-t border-niebla pt-4">
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
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
