"use client";

import {
  ETIQUETA_CATEGORIA,
  type CategoriaDecision,
  type Diagnostico as TipoDiagnostico,
  type EstadoSintesis,
  type Hallazgo,
} from "@/lib/sintesis";
import IconoClay from "@/components/ui/IconoClay";
import {
  GlifoAgua,
  GlifoAplicacion,
  GlifoClima,
  GlifoContexto,
  GlifoCultivo,
} from "@/components/ui/iconos/Glifos";

/**
 * La conclusión, arriba de todo. La evidencia que la sostiene queda a un
 * toque de distancia, nunca escondida: el productor lee la conclusión y el
 * agrónomo abre la evidencia.
 *
 * El color no es el único portador del estado — cada uno lleva su palabra al
 * lado, mismo criterio de daltonismo que la línea de tiempo horaria. Los
 * íconos claymorphism son un segundo canal de reconocimiento (qué categoría
 * es), no reemplazan a ese criterio: nunca usan verde/ámbar/rojo.
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

const ICONO_CATEGORIA: Record<CategoriaDecision, () => React.JSX.Element> = {
  aplicacion: GlifoAplicacion,
  agua: GlifoAgua,
  clima: GlifoClima,
  cultivo: GlifoCultivo,
  contexto: GlifoContexto,
};

export default function Diagnostico({ diagnostico }: { diagnostico: TipoDiagnostico }) {
  const estilo = ESTADO[diagnostico.estado];
  const conDatos = diagnostico.hallazgos.filter((h) => h.estado !== "sin_datos");
  const sinDatos = diagnostico.hallazgos.filter((h) => h.estado === "sin_datos");
  const IconoPrincipal = diagnostico.principal ? ICONO_CATEGORIA[diagnostico.principal] : null;

  return (
    <section aria-label="Diagnóstico del lote" className="mt-5">
      <div className={`clay-elevado rounded-3xl border-l-[6px] ${estilo.borde} p-5`}>
        <div className="flex items-center gap-3">
          {IconoPrincipal ? (
            <IconoClay tono="neutro" tamano="md">
              <IconoPrincipal />
            </IconoClay>
          ) : null}
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className={`h-3 w-3 shrink-0 rounded-full ${estilo.punto}`} aria-hidden />
            <span className={estilo.texto}>{estilo.etiqueta}</span>
          </p>
        </div>
        {/* Hereda el peso visual que tenía el veredicto, que decía lo mismo:
            sigue habiendo un elemento memorable, pero uno solo. */}
        <h2 className="mt-2 text-[clamp(28px,7vw,40px)] leading-[1.1] font-extrabold text-tinta">
          {diagnostico.titular}
        </h2>

        <div className="mt-5 space-y-5">
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
          <div className="clay-hundido mt-5 rounded-2xl p-4">
            <p className="text-xs font-bold text-tinta/60">
              Sin datos suficientes para concluir
            </p>
            <ul className="mt-2 space-y-1.5">
              {sinDatos.map((h) => (
                <li key={h.categoria} className="text-xs leading-relaxed font-medium text-tinta/60">
                  <span className="font-bold">{ETIQUETA_CATEGORIA[h.categoria]}:</span>{" "}
                  {h.interpretacion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-relaxed font-medium text-tinta/60">
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
  const Icono = ICONO_CATEGORIA[hallazgo.categoria];

  return (
    <div className="flex gap-3">
      <IconoClay tono="neutro" tamano="sm">
        <Icono />
      </IconoClay>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-xs font-bold text-tinta/60">
          <span className={`h-2 w-2 shrink-0 rounded-full ${estilo.punto}`} aria-hidden />
          {/* Con el titular repetido arriba, el estado también lo estaría. */}
          {tituloYaDicho
            ? ETIQUETA_CATEGORIA[hallazgo.categoria]
            : `${ETIQUETA_CATEGORIA[hallazgo.categoria]} · ${estilo.etiqueta}`}
        </p>
        {tituloYaDicho ? null : (
          <p className="mt-0.5 text-base font-bold text-tinta">{hallazgo.titular}</p>
        )}
        <p className="mt-1 text-sm leading-relaxed font-medium text-tinta/80">
          {hallazgo.interpretacion}
        </p>

        {hallazgo.aEvaluar ? (
          <p className="clay-hundido mt-3 rounded-xl p-3 text-sm leading-relaxed font-medium text-tinta">
            <span className="font-bold text-pizarra">Qué conviene evaluar: </span>
            {hallazgo.aEvaluar}
          </p>
        ) : null}

        {hallazgo.evidencia.length > 0 ? (
          <details className="mt-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-bold text-pizarra underline underline-offset-2">
              Ver los datos que lo sustentan
            </summary>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {hallazgo.evidencia.map((e) => (
                <div key={e.etiqueta} className="rounded-xl border border-niebla bg-papel p-3">
                  <dt className="text-xs font-semibold text-tinta/60">{e.etiqueta}</dt>
                  <dd className="text-sm font-bold tabular-nums text-tinta">{e.valor}</dd>
                </div>
              ))}
            </dl>
          </details>
        ) : null}
      </div>
    </div>
  );
}
