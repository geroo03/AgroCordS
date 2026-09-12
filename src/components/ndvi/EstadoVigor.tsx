import { clasificarVigor, ETIQUETA_VIGOR } from "@/lib/ndvi";
import type { ObservacionSatelital } from "@/lib/satelital/tipos";

export default function EstadoVigor({ lectura }: { lectura: ObservacionSatelital | null }) {
  if (!lectura) {
    return (
      <section className="py-8">
        <p className="text-[28px] font-extrabold text-tinta/50">Sin lecturas</p>
      </section>
    );
  }

  if (lectura.ndvi === null) {
    return (
      <section className="py-6">
        <p className="text-[16px] font-semibold text-tinta/60">Observación del {lectura.fecha}</p>
        <h1 className="mt-1 text-[clamp(32px,9vw,41px)] font-extrabold leading-none text-tinta/50">
          Sin dato confiable
        </h1>
        <p className="mt-2 text-[18px] text-tinta/70">
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
      <p className="text-[16px] font-semibold text-tinta/60">Observación del {lectura.fecha}</p>
      <h1 className={`mt-1 text-[clamp(41px,11vw,55px)] font-extrabold leading-none ${color}`}>
        {ETIQUETA_VIGOR[nivel]}
      </h1>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="shadow-sunken rounded-xl bg-[#f4f6fa] p-3">
          <p className="text-[14px] text-tinta/70">NDVI</p>
          <p className="text-[28px] font-bold tabular-nums">{lectura.ndvi.toFixed(2)}</p>
        </div>
        <div className="shadow-sunken rounded-xl bg-[#f4f6fa] p-3">
          <p className="text-[14px] text-tinta/70">NDRE</p>
          <p className="text-[28px] font-bold tabular-nums">
            {lectura.ndre !== null ? lectura.ndre.toFixed(2) : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
