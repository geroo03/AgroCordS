import { horaCorta } from "@/lib/formato";
import type { HourAssessment } from "@/lib/spray-engine";

interface Props {
  actual: HourAssessment | null;
  /** false cuando el pronóstico arranca en el futuro y mostramos su primera hora. */
  esAhora: boolean;
}

/** Una razón limitante en una línea, con el dato concreto adelante. */
function razonCorta(a: HourAssessment): string {
  const bloqueo = a.reasons.find((r) => r.severity === "blocker");
  const c = a.conditions;
  switch (bloqueo?.code) {
    case "VIENTO_EXCESIVO":
      return `Viento de ${Math.round(c.windSpeedKmh)} km/h`;
    case "VIENTO_INSUFICIENTE":
      return `Aire demasiado quieto: ${Math.round(c.windSpeedKmh)} km/h`;
    case "DELTA_T_ALTO":
      return `Delta-T de ${a.deltaT}: la gota se evapora en el aire`;
    case "INVERSION_TERMICA":
      return "Riesgo de inversión térmica";
    case "LLUVIA_EN_CURSO":
      return "Está lloviendo sobre el lote";
    case "LLUVIA_PROXIMA":
      return bloqueo.message.split(".")[0];
  }
  const advertencia = a.reasons.find((r) => r.severity === "warning");
  if (advertencia) return advertencia.message;
  return `Delta-T ${a.deltaT} · viento ${Math.round(c.windSpeedKmh)} km/h · ${Math.round(c.relativeHumidityPct)}% HR`;
}

export default function Veredicto({ actual, esAhora }: Props) {
  if (!actual) {
    return (
      <section className="shadow-extruded flex min-h-[32dvh] flex-col justify-center rounded-xl bg-white p-6">
        <p className="text-[clamp(46px,13vw,64px)] leading-none font-extrabold text-tinta/50">
          Sin datos
        </p>
        <p className="mt-3 text-[23px] font-medium text-tinta/70">
          No hay pronóstico para la hora actual.
        </p>
      </section>
    );
  }

  const sePuede = actual.suitability === "optima" || actual.suitability === "aceptable";
  const palabra = sePuede
    ? "Pulverizá ahora"
    : actual.suitability === "marginal"
      ? "Al límite"
      : "No pulverices";
  const color = sePuede
    ? "text-optima"
    : actual.suitability === "marginal"
      ? "text-marginal"
      : "text-bloqueo";
  const clay = sePuede
    ? "clay-token--optima"
    : actual.suitability === "marginal"
      ? "clay-token--marginal"
      : "clay-token--bloqueo";
  const icono = sePuede ? "check_circle" : actual.suitability === "marginal" ? "warning" : "block";

  return (
    <section className="shadow-extruded flex min-h-[32dvh] flex-col justify-center gap-4 rounded-xl bg-white p-6">
      {!esAhora ? (
        <p className="text-[16px] font-semibold text-tinta/60">
          Primera hora del pronóstico · {horaCorta(actual.time)}
        </p>
      ) : null}
      <div className="flex items-center gap-4">
        <span className={`clay-token ${clay} h-16 w-16 shrink-0`} aria-hidden>
          <span
            className={`material-symbols-outlined ${color} text-[34px]`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icono}
          </span>
        </span>
        <h1 className={`text-[clamp(41px,12vw,60px)] leading-none font-extrabold tracking-tight ${color}`}>
          {palabra}
        </h1>
      </div>
      <p className="text-[23px] font-medium text-tinta">{razonCorta(actual)}</p>
    </section>
  );
}
