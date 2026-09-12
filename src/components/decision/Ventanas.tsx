"use client";

import { ETIQUETA_ESTADO, etiquetaDia, horaCorta } from "@/lib/formato";
import type { SprayWindow } from "@/lib/spray-engine";

interface Props {
  ventanas: readonly SprayWindow[];
  onElegir: (time: string) => void;
}

export default function Ventanas({ ventanas, onElegir }: Props) {
  const mejores = ventanas.slice(0, 3);

  return (
    <section>
      <h2 className="text-[24px] font-bold">Próximas ventanas</h2>
      {mejores.length === 0 ? (
        <p className="mt-2 text-[18px] text-tinta/70">
          No hay ventanas de al menos 2 h seguidas en las próximas 72 h.
        </p>
      ) : (
        <ol className="mt-2 space-y-2">
          {mejores.map((v, i) => (
            <li key={v.startTime}>
              <button
                type="button"
                onClick={() => onElegir(v.startTime)}
                className="shadow-extruded min-h-11 w-full rounded-xl bg-white p-3 text-left transition-transform active:scale-[0.99]"
              >
                <span className="font-bold text-pizarra">
                  {etiquetaDia(v.startTime.slice(0, 10))} {horaCorta(v.startTime)}
                </span>{" "}
                <span className="text-tinta">· {v.hours} h seguidas</span>
                <span className="block text-[16px] text-[#444651]">
                  Mejor condición: {ETIQUETA_ESTADO[v.bestSuitability].toLowerCase()} ·
                  puntaje {v.averageScore}
                  {i === 0 ? " · la mejor de las 72 h" : ""}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
