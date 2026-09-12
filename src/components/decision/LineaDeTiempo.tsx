"use client";

import { ETIQUETA_ESTADO, etiquetaDia, horaCorta } from "@/lib/formato";
import type { HourAssessment, Suitability } from "@/lib/spray-engine";

interface Props {
  horas: readonly HourAssessment[];
  seleccionada: string | null;
  /** Hora actual del pronóstico; las anteriores se muestran atenuadas. */
  ahora: string | null;
  onSeleccionar: (time: string) => void;
}

/**
 * Cada estado lleva color y además una marca de forma: verde llena,
 * ámbar rayada, rojo sólo borde. El color nunca es el único código.
 */
function claseFranja(s: Suitability): string {
  switch (s) {
    case "optima":
      return "bg-optima";
    case "aceptable":
      return "bg-aceptable";
    case "marginal":
      return "franja-rayada";
    case "no_recomendada":
      return "border-2 border-bloqueo bg-transparent";
  }
}

export default function LineaDeTiempo({ horas, seleccionada, ahora, onSeleccionar }: Props) {
  const grupos = new Map<string, HourAssessment[]>();
  for (const h of horas) {
    const dia = h.time.slice(0, 10);
    const grupo = grupos.get(dia);
    if (grupo) grupo.push(h);
    else grupos.set(dia, [h]);
  }

  return (
    <section>
      <h2 className="text-lg font-bold">Próximas 72 horas</h2>
      <div className="mt-2 space-y-4">
        {[...grupos.entries()].map(([dia, delDia]) => (
          <div key={dia}>
            <p className="mb-1 text-base font-semibold">{etiquetaDia(dia)}</p>
            <div className="flex gap-[2px]">
              {delDia.map((h) => (
                <button
                  key={h.time}
                  type="button"
                  onClick={() => onSeleccionar(h.time)}
                  aria-label={`${horaCorta(h.time)}, ${ETIQUETA_ESTADO[h.suitability]}`}
                  aria-pressed={seleccionada === h.time}
                  className={`flex h-11 min-w-0 flex-1 items-center ${
                    ahora && h.time < ahora ? "opacity-40" : ""
                  }`}
                >
                  <span
                    className={`h-8 w-full rounded-[2px] transition-colors duration-200 ${claseFranja(
                      h.suitability,
                    )} ${
                      seleccionada === h.time
                        ? "ring-2 ring-pizarra ring-offset-1 ring-offset-papel"
                        : ""
                    }`}
                  />
                </button>
              ))}
            </div>
            {delDia.length === 24 ? (
              <div className="flex text-[10px] text-tinta/50">
                {["00", "06", "12", "18"].map((t) => (
                  <span key={t} className="flex-1">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta/70">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-[2px] bg-optima" aria-hidden />
          Favorable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="franja-rayada h-3 w-5 rounded-[2px]" aria-hidden />
          Marginal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-[2px] border-2 border-bloqueo" aria-hidden />
          No recomendada
        </span>
      </div>
    </section>
  );
}
