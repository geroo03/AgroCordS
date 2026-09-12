import { clasificarVigor, ETIQUETA_VIGOR } from "@/lib/ndvi";
import type { ObservacionSatelital } from "@/lib/satelital/tipos";

export default function EstadoVigor({ lectura }: { lectura: ObservacionSatelital | null }) {
  if (!lectura) {
    return (
      <section className="py-8">
        <p className="text-2xl font-extrabold text-tinta/50">Sin lecturas</p>
      </section>
    );
  }

  if (lectura.ndvi === null) {
    return (
      <section className="py-6">
        <p className="text-sm font-semibold text-tinta/60">Observación del {lectura.fecha}</p>
        <h1 className="mt-1 text-[clamp(28px,8vw,36px)] font-extrabold leading-none text-tinta/50">
          Sin dato confiable
        </h1>
        <p className="mt-2 text-base text-tinta/70">
          Hubo pasada satelital, pero el lote quedó cubierto por nubes
          {lectura.coberturaNubesPct !== null ? ` (${lectura.coberturaNubesPct} %)` : ""}.
        </p>
      </section>
    );
  }

  const nivel = clasificarVigor(lectura.ndvi);
  const color =
    nivel === "alto" ? "text-optima" : nivel === "medio" ? "text-marginal" : "text-bloqueo";

  return (
    <section className="py-6">
      <p className="text-sm font-semibold text-tinta/60">Observación del {lectura.fecha}</p>
      <h1 className={`mt-1 text-[clamp(36px,10vw,48px)] font-extrabold leading-none ${color}`}>
        {ETIQUETA_VIGOR[nivel]}
      </h1>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-niebla/60 p-3">
          <p className="text-xs text-tinta/70">NDVI</p>
          <p className="text-2xl font-bold tabular-nums">{lectura.ndvi.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-niebla/60 p-3">
          <p className="text-xs text-tinta/70">NDRE</p>
          <p className="text-2xl font-bold tabular-nums">
            {lectura.ndre !== null ? lectura.ndre.toFixed(2) : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
