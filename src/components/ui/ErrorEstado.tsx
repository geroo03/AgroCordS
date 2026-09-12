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
    <div role="alert" className="shadow-sunken flex items-start gap-3 rounded-xl bg-white p-4">
      <span className="material-symbols-outlined shrink-0 text-[25px] text-bloqueo">error</span>
      <div className="min-w-0 flex-1">
        <p className="text-[18px] font-medium text-tinta">{mensaje}</p>
        {onReintentar ? (
          <Boton variante="secundario" className="mt-3" onClick={onReintentar}>
            Reintentar
          </Boton>
        ) : null}
      </div>
    </div>
  );
}
