"use client";

import Link from "next/link";
import { useState } from "react";
import { guardarAplicacion } from "@/lib/almacen";
import type { HourAssessment, ProductType } from "@/lib/spray-engine";
import Boton from "@/components/ui/Boton";
import Campo from "@/components/ui/Campo";

interface Props {
  loteId: string;
  tipoProducto: ProductType;
  /** Condiciones del momento; se congelan con el registro. */
  condiciones: HourAssessment | null;
  /**
   * Producto elegido arriba, en el selector. Antes este componente tenía su
   * propio campo de texto y el usuario terminaba escribiendo dos veces lo
   * mismo: se registra lo que ya está seleccionado.
   */
  productoNombre: string;
}

export default function RegistrarAplicacion({
  loteId,
  tipoProducto,
  condiciones,
  productoNombre,
}: Props) {
  const [notas, setNotas] = useState("");
  const [guardada, setGuardada] = useState(false);

  const sinProducto = productoNombre.trim().length === 0;

  const registrar = () => {
    if (!condiciones || sinProducto) return;
    guardarAplicacion({
      loteId,
      productoNombre: productoNombre.trim().slice(0, 120),
      tipoProducto,
      condiciones,
      notas: notas.trim() ? notas.trim() : null,
    });
    setGuardada(true);
    setNotas("");
  };

  return (
    <section>
      <h2 className="text-lg font-bold">Registrar aplicación</h2>
      <p className="mt-1 text-sm text-tinta/70">
        Congela las condiciones de este momento como respaldo de la decisión.
      </p>

      {guardada ? (
        <p className="mt-2 rounded-lg bg-niebla/60 p-3 text-base">
          Aplicación registrada.{" "}
          <Link
            href={`/lotes/${loteId}/historial`}
            className="font-semibold text-pizarra underline"
          >
            Ver historial
          </Link>
        </p>
      ) : null}

      <div className="mt-3 space-y-3">
        <Campo
          etiqueta="Notas (opcional)"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Dosis, equipo, observaciones"
        />
        <Boton
          onClick={registrar}
          disabled={!condiciones || sinProducto}
          className="w-full"
        >
          {sinProducto
            ? "Elegí un producto para registrar"
            : `Registrar ${productoNombre} con las condiciones actuales`}
        </Boton>
        {!condiciones ? (
          <p className="text-sm text-tinta/60">
            Sin pronóstico para la hora actual no se pueden congelar condiciones.
          </p>
        ) : null}
      </div>
    </section>
  );
}
