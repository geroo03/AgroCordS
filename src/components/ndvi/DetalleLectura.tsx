import { clasificarVigor, ETIQUETA_VIGOR } from "@/lib/ndvi";
import type { ObservacionSatelital } from "@/lib/satelital/tipos";

export default function DetalleLectura({ lectura }: { lectura: ObservacionSatelital }) {
  if (lectura.ndvi === null) {
    return (
      <section aria-live="polite">
        <h2 className="text-lg font-bold">{lectura.fecha} · Sin dato confiable</h2>
        <p className="mt-3 text-base text-tinta/70">
          Sentinel-2 pasó por el lote este día, pero la escena quedó dominada por nubes
          {lectura.coberturaNubesPct !== null ? ` (${lectura.coberturaNubesPct} % sobre el lote)` : ""}{" "}
          y no hay un valor confiable de NDVI/NDRE. No se interpola con las fechas vecinas.
        </p>
      </section>
    );
  }

  const nivel = clasificarVigor(lectura.ndvi);
  // Cuando NDRE cae muy por debajo de NDVI puede señalar estrés (nitrógeno,
  // sanidad) que NDVI todavía no muestra por estar saturado en canopeo denso.
  const brechaAlta =
    lectura.ndre !== null && lectura.ndvi > 0 && lectura.ndre / lectura.ndvi < 0.45;

  return (
    <section aria-live="polite">
      <h2 className="text-lg font-bold">
        {lectura.fecha} · {ETIQUETA_VIGOR[nivel]}
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-niebla/60 p-2">
          <dt className="text-xs text-tinta/70">NDVI</dt>
          <dd className="text-base font-semibold tabular-nums">{lectura.ndvi.toFixed(2)}</dd>
        </div>
        <div className="rounded-lg bg-niebla/60 p-2">
          <dt className="text-xs text-tinta/70">NDRE</dt>
          <dd className="text-base font-semibold tabular-nums">
            {lectura.ndre !== null ? lectura.ndre.toFixed(2) : "—"}
          </dd>
        </div>
        <div className="rounded-lg bg-niebla/60 p-2">
          <dt className="text-xs text-tinta/70">Nubes</dt>
          <dd className="text-base font-semibold tabular-nums">
            {lectura.coberturaNubesPct !== null ? `${lectura.coberturaNubesPct} %` : "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-base">
        {brechaAlta
          ? "NDRE bajo en relación al NDVI: en etapas avanzadas puede señalar estrés que el NDVI todavía no muestra por estar saturado."
          : "NDVI y NDRE evolucionan de forma consistente para esta observación."}
      </p>
    </section>
  );
}
