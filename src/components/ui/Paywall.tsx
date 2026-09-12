"use client";

import { useState } from "react";
import Boton from "./Boton";
import PagoOnchain from "@/components/pagos/PagoOnchain";
import { activarPremium } from "@/lib/plan";

interface Props {
  titulo: string;
  descripcion: string;
  onActivado: () => void;
}

/**
 * Bloqueo de una función Premium. El botón simula la activación en
 * localStorage para la demo — no hay checkout ni cobro real. Nunca pide
 * datos de tarjeta: eso queda fuera de una demo de hackathon a propósito.
 */
export default function Paywall({ titulo, descripcion, onActivado }: Props) {
  const [activando, setActivando] = useState(false);

  const activar = () => {
    setActivando(true);
    activarPremium();
    // Pausa breve: se siente una acción, no un truco de UI.
    setTimeout(onActivado, 350);
  };

  // El pago onchain verificado activa el mismo flag que el botón de demo —
  // una vez confirmado en la red, Premium persiste igual en localStorage.
  const activarPorPago = () => {
    activarPremium();
    onActivado();
  };

  return (
    <div className="shadow-extruded rounded-xl bg-white p-5 text-center">
      <span className="clay-token clay-token--pizarra mx-auto flex h-16 w-16" aria-hidden>
        <span
          className="material-symbols-outlined text-pizarra text-[32px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          lock
        </span>
      </span>
      <h2 className="mt-3 text-[24px] font-bold">{titulo}</h2>
      <p className="mt-1 text-[16px] text-tinta/70">{descripcion}</p>
      <Boton onClick={activar} disabled={activando} className="mt-4 w-full">
        {activando ? "Activando…" : "Activar Premium (demo)"}
      </Boton>
      <p className="mt-2 text-[14px] text-tinta/50">
        Simulación para la demo — no se realiza ningún cobro.
      </p>

      {/* Sólo aparece con contrato y destino configurados (ver .env.example);
          si no, esta sección no se renderiza y el botón de arriba sigue
          siendo el único camino, como antes. */}
      <PagoOnchain onVerificado={activarPorPago} />
    </div>
  );
}
