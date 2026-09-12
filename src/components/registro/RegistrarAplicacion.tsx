"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { guardarAplicacion } from "@/lib/almacen";
import type { HourAssessment, ProductType } from "@/lib/spray-engine";
import Boton from "@/components/ui/Boton";
import Campo from "@/components/ui/Campo";

interface Props {
  loteId: string;
  tipoProducto: ProductType;
  /** Condiciones del momento; se congelan con el registro. */
  condiciones: HourAssessment | null;
  /** Producto elegido en el selector en cascada; prellena el campo. */
  productoSugerido?: string | null;
}

export default function RegistrarAplicacion({
  loteId,
  tipoProducto,
  condiciones,
  productoSugerido = null,
}: Props) {
  const [producto, setProducto] = useState("");
  const [notas, setNotas] = useState("");
  const [guardada, setGuardada] = useState(false);

  useEffect(() => {
    if (productoSugerido) setProducto(productoSugerido);
  }, [productoSugerido]);

  const registrar = () => {
    if (!condiciones || producto.trim().length === 0) return;
    guardarAplicacion({
      loteId,
      productoNombre: producto.trim().slice(0, 120),
      tipoProducto,
      condiciones,
      notas: notas.trim() ? notas.trim() : null,
    });
    setGuardada(true);
    setProducto("");
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
          <Link href={`/lotes/${loteId}/historial`} className="font-semibold text-pizarra underline">
            Ver historial
          </Link>
        </p>
      ) : null}
      <div className="mt-3 space-y-3">
        <Campo
          etiqueta="Producto"
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          placeholder="Ej.: glifosato 66,2"
          maxLength={120}
        />
        <Campo
          etiqueta="Notas (opcional)"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Dosis, equipo, observaciones"
        />
        <Boton
          onClick={registrar}
          disabled={!condiciones || producto.trim().length === 0}
          className="w-full"
        >
          Registrar con condiciones actuales
        </Boton>
        {!condiciones ? (
          <p className="text-sm text-tinta/60">
            Sin pronóstico para la hora actual no se puede congelar condiciones.
          </p>
        ) : null}
      </div>
    </section>
  );
}
