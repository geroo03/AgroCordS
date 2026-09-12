"use client";

import { useState } from "react";
import IconoClay from "@/components/ui/IconoClay";
import { GlifoChat } from "@/components/ui/iconos/Glifos";
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
 * Botón flotante que abre el asistente conversacional del lote. Lleva la
 * etiqueta "Asistente" siempre a la vista al lado del ícono — nunca sólo el
 * dibujo — pensado para alguien que recién ve la app y no sabe qué es ese
 * globo de diálogo si no lo dice. Vive por encima del footer legal fijo
 * (z-40, `bottom-16`) y por debajo de la barra de navegación (z-50).
 */
export default function BotonChat({ lote, diagnostico, valor, aplicaciones }: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="clay-boton-primario fixed bottom-32 right-5 z-40 flex min-h-16 items-center gap-2.5 rounded-full py-3 pr-5 pl-3.5 text-white active:scale-95"
      >
        <IconoClay tono="azul" tamano="md">
          <GlifoChat />
        </IconoClay>
        <span className="text-base font-bold">Asistente</span>
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
