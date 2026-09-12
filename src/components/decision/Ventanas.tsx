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
      <h2 className="text-lg font-bold">Próximas ventanas</h2>
      {mejores.length === 0 ? (
        <p className="mt-2 text-base text-tinta/70">
          No hay ventanas de al menos 2 h seguidas en las próximas 72 h.
        </p>
      ) : (
        <ol className="mt-2 space-y-2">
          {mejores.map((v, i) => (
            <li key={v.startTime}>
              <button
                type="button"
                onClick={() => onElegir(v.startTime)}
                className="min-h-11 w-full rounded-lg border border-niebla p-3 text-left"
              >
                <span className="font-semibold">
                  {etiquetaDia(v.startTime.slice(0, 10))} {horaCorta(v.startTime)}
                </span>{" "}
                · {v.hours} h seguidas
                <span className="block text-sm text-tinta/70">
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
