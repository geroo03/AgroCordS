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
    <div role="alert" className="clay-elevado rounded-2xl border-2 border-bloqueo/30 p-6">
      <p className="text-base font-bold text-tinta">{mensaje}</p>
      {onReintentar ? (
        <Boton variante="secundario" className="mt-4 w-full" onClick={onReintentar}>
          Reintentar
        </Boton>
      ) : null}
    </div>
  );
}
