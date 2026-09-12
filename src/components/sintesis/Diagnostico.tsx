"use client";

import {
  ETIQUETA_CATEGORIA,
  type Diagnostico as TipoDiagnostico,
  type EstadoSintesis,
  type Hallazgo,
} from "@/lib/sintesis";

/**
 * La conclusión, arriba de todo. La evidencia que la sostiene queda a un
 * toque de distancia, nunca escondida: el productor lee la conclusión y el
 * agrónomo abre la evidencia.
 *
 * El color no es el único portador del estado — cada uno lleva su palabra al
 * lado, mismo criterio de daltonismo que la línea de tiempo horaria.
 */

const ESTADO: Record<
  EstadoSintesis,
  { etiqueta: string; punto: string; texto: string; borde: string }
> = {
  favorable: {
    etiqueta: "Situación favorable",
    punto: "bg-optima",
    texto: "text-optima",
    borde: "border-optima/30",
  },
  atencion: {
    etiqueta: "Atención",
    punto: "bg-marginal",
    texto: "text-marginal",
    borde: "border-marginal/40",
  },
  riesgo: {
    etiqueta: "Riesgo",
    punto: "bg-bloqueo",
    texto: "text-bloqueo",
    borde: "border-bloqueo/40",
  },
  sin_datos: {
    etiqueta: "Sin datos suficientes",
    punto: "bg-tinta/30",
    texto: "text-tinta/60",
    borde: "border-niebla",
  },
};

export default function Diagnostico({ diagnostico }: { diagnostico: TipoDiagnostico }) {
  const estilo = ESTADO[diagnostico.estado];
  const conDatos = diagnostico.hallazgos.filter((h) => h.estado !== "sin_datos");
  const sinDatos = diagnostico.hallazgos.filter((h) => h.estado === "sin_datos");

  return (
    <section aria-label="Diagnóstico del lote" className="mt-5">
      <div className={`rounded-xl border ${estilo.borde} p-4`}>
        <p className="flex items-center gap-2 text-sm font-bold">
          <span className={`h-3 w-3 shrink-0 rounded-full ${estilo.punto}`} aria-hidden />
          <span className={estilo.texto}>{estilo.etiqueta}</span>
        </p>
        <h2 className="mt-1 text-xl leading-snug font-extrabold">{diagnostico.titular}</h2>

        <div className="mt-4 space-y-4">
          {conDatos.map((h) => (
            <BloqueHallazgo
              key={h.categoria}
              hallazgo={h}
              // El titular de arriba salió de este bloque: no se repite.
              tituloYaDicho={h.categoria === diagnostico.principal}
            />
          ))}
        </div>

        {sinDatos.length > 0 ? (
          <div className="mt-4 border-t border-niebla pt-3">
            <p className="text-xs font-semibold text-tinta/60">
              Sin datos suficientes para concluir
            </p>
            <ul className="mt-1 space-y-1">
              {sinDatos.map((h) => (
                <li key={h.categoria} className="text-xs leading-snug text-tinta/60">
                  <span className="font-semibold">{ETIQUETA_CATEGORIA[h.categoria]}:</span>{" "}
                  {h.interpretacion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-xs leading-snug text-tinta/60">
        Interpretación automática de datos meteorológicos, satelitales e históricos. No
        reemplaza el criterio de un profesional matriculado.
      </p>
    </section>
  );
}

function BloqueHallazgo({
  hallazgo,
  tituloYaDicho = false,
}: {
  hallazgo: Hallazgo;
  tituloYaDicho?: boolean;
}) {
  const estilo = ESTADO[hallazgo.estado];

  return (
    <div className="border-l-2 border-niebla pl-3">
      <p className="flex items-center gap-2 text-xs font-semibold text-tinta/60">
        <span className={`h-2 w-2 shrink-0 rounded-full ${estilo.punto}`} aria-hidden />
        {/* Con el titular repetido arriba, el estado también lo estaría. */}
        {tituloYaDicho
          ? ETIQUETA_CATEGORIA[hallazgo.categoria]
          : `${ETIQUETA_CATEGORIA[hallazgo.categoria]} · ${estilo.etiqueta}`}
      </p>
      {tituloYaDicho ? null : (
        <p className="mt-0.5 text-base font-bold">{hallazgo.titular}</p>
      )}
      <p className="mt-1 text-sm leading-relaxed text-tinta/80">{hallazgo.interpretacion}</p>

      {hallazgo.aEvaluar ? (
        <p className="mt-2 rounded-lg bg-niebla/60 p-2 text-sm leading-relaxed">
          <span className="font-semibold">Qué conviene evaluar: </span>
          {hallazgo.aEvaluar}
        </p>
      ) : null}

      {hallazgo.evidencia.length > 0 ? (
        <details className="mt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-xs font-semibold text-pizarra underline">
            Ver los datos que lo sustentan
          </summary>
          <dl className="mt-1 grid grid-cols-2 gap-2">
            {hallazgo.evidencia.map((e) => (
              <div key={e.etiqueta} className="rounded-lg bg-niebla/60 p-2">
                <dt className="text-xs text-tinta/70">{e.etiqueta}</dt>
                <dd className="text-sm font-semibold tabular-nums">{e.valor}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  );
}
