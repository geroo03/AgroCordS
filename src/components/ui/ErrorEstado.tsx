"use client";

import Boton from "./Boton";

export default function ErrorEstado({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar?: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border border-bloqueo/40 bg-bloqueo/5 p-5">
      <p className="text-base font-medium">{mensaje}</p>
      {onReintentar ? (
        <Boton variante="secundario" className="mt-3" onClick={onReintentar}>
          Reintentar
        </Boton>
      ) : null}
    </div>
  );
}
