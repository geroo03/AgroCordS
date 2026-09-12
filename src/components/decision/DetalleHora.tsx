import { ETIQUETA_ESTADO, horaCorta } from "@/lib/formato";
import type { HourAssessment } from "@/lib/spray-engine";

const PUNTO_SEVERIDAD = {
  blocker: "bg-bloqueo",
  warning: "bg-marginal",
  info: "bg-optima",
} as const;

export default function DetalleHora({ hora }: { hora: HourAssessment }) {
  const c = hora.conditions;
  const datos: [string, string][] = [
    ["Delta-T", hora.deltaT.toLocaleString("es-AR")],
    ["Viento", `${Math.round(c.windSpeedKmh)} km/h`],
    ["Ráfagas", `${Math.round(c.windGustsKmh)} km/h`],
    ["Temperatura", `${Math.round(c.temperatureC)} °C`],
    ["Humedad", `${Math.round(c.relativeHumidityPct)} %`],
    ["Lluvia", `${c.precipitationMm.toLocaleString("es-AR")} mm`],
  ];

  return (
    <section aria-live="polite">
      <h2 className="text-lg font-bold">
        {horaCorta(hora.time)} · {ETIQUETA_ESTADO[hora.suitability]}
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {datos.map(([nombre, valor]) => (
          <div key={nombre} className="rounded-lg bg-niebla/60 p-2">
            <dt className="text-xs text-tinta/70">{nombre}</dt>
            <dd className="text-base font-semibold tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-3 space-y-2">
        {hora.reasons.map((r) => (
          <li key={r.code + r.message} className="flex items-start gap-2 text-base">
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${PUNTO_SEVERIDAD[r.severity]}`}
              aria-hidden
            />
            <span>{r.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
