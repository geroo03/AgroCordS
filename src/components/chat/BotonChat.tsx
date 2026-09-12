"use client";

import { useState } from "react";
import type { ValorDecision } from "@/lib/riesgo";
import type { Diagnostico } from "@/lib/sintesis";
import type { Aplicacion } from "@/lib/tipos";
import VentanaChat from "./VentanaChat";

interface Props {
  readonly lote: { readonly nombre: string; readonly cultivo: string | null; readonly areaHa: number };
  readonly diagnostico: Diagnostico;
  readonly valor: ValorDecision | null;
  readonly aplicaciones: readonly Aplicacion[];
}

/**
 * Botón flotante que abre el asistente conversacional del lote. Vive por
 * encima del footer legal fijo (z-40, `bottom-16`) y por debajo de la barra
 * de navegación (z-50): se ubica más arriba de los dos para no taparlos.
 */
export default function BotonChat({ lote, diagnostico, valor, aplicaciones }: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir asistente del lote"
        className="fixed bottom-32 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-pizarra text-white shadow-lg active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden
        >
          <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.35 0-2.62-.32-3.73-.9L3 20l1.1-4.15A8.47 8.47 0 0 1 3 11.5 8.5 8.5 0 0 1 11.5 3h1A8.5 8.5 0 0 1 21 11.5Z" />
        </svg>
      </button>

      {abierto ? (
        <VentanaChat
          lote={lote}
          diagnostico={diagnostico}
          valor={valor}
          aplicaciones={aplicaciones}
          onCerrar={() => setAbierto(false)}
        />
      ) : null}
    </>
  );
}
