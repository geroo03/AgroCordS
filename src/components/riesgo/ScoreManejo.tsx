import { ETIQUETA_BANDA, type ScoreManejo as TScoreManejo } from "@/lib/riesgo";

const COLOR_BANDA = {
  alto: "text-optima",
  medio: "text-marginal",
  bajo: "text-bloqueo",
} as const;

export default function ScoreManejo({ resultado }: { resultado: TScoreManejo }) {
  if (!resultado.confiable) {
    return (
      <div className="rounded-xl bg-niebla/60 p-4 text-sm text-tinta/80">
        Todavía no hay suficientes aplicaciones registradas ni observaciones de vigor
        confiables en este lote. El score aparece apenas haya datos: registrá una
        aplicación o esperá una pasada satelital sin nubes.
      </div>
    );
  }

  return (
    <section>
      <p
        className={`text-[clamp(40px,11vw,56px)] font-extrabold leading-none tabular-nums ${COLOR_BANDA[resultado.banda]}`}
      >
        {resultado.score}
      </p>
      <p className={`mt-1 text-lg font-bold ${COLOR_BANDA[resultado.banda]}`}>
        {ETIQUETA_BANDA[resultado.banda]}
      </p>

      <ul className="mt-4 space-y-2">
        {resultado.factores.map((f) => (
          <li key={f.etiqueta} className="rounded-lg border border-niebla p-3">
            <p className="flex items-center justify-between gap-2 text-sm font-semibold">
              <span>{f.etiqueta}</span>
              <span className={f.puntos >= 0 ? "text-optima" : "text-bloqueo"}>
                {f.puntos >= 0 ? "+" : ""}
                {f.puntos}
              </span>
            </p>
            <p className="mt-1 text-sm text-tinta/70">{f.detalle}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
