import {
  ETIQUETA_CONFIANZA,
  type ObservacionSatelital,
  type SerieSatelital,
} from "@/lib/satelital/tipos";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

/**
 * Indicador de fuente. Es imposible confundir una serie real con una de
 * demostración: cambian el texto, el color y el ícono, no sólo un detalle.
 */
export default function FuenteDatos({
  serie,
  ultima,
}: {
  serie: SerieSatelital;
  ultima: ObservacionSatelital | null;
}) {
  if (serie.real) {
    return (
      <div className="rounded-xl border border-niebla p-3 text-sm">
        <p className="text-xs text-tinta/60">Fuente</p>
        <p className="font-semibold text-optima">🛰 Sentinel-2 · Copernicus</p>
        {ultima ? (
          <dl className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs text-tinta/60">Última observación</dt>
              <dd className="font-semibold tabular-nums">{fechaLegible(ultima.fecha)}</dd>
            </div>
            <div>
              <dt className="text-xs text-tinta/60">Nubes sobre el lote</dt>
              <dd className="font-semibold tabular-nums">
                {ultima.coberturaNubesPct !== null ? `${ultima.coberturaNubesPct} %` : "—"}
              </dd>
            </div>
            {ultima.confianza !== null ? (
              <div className="col-span-2">
                <dt className="text-xs text-tinta/60">Respaldo del valor</dt>
                <dd className="font-semibold">{ETIQUETA_CONFIANZA[ultima.confianza]}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-niebla/60 p-3 text-sm text-tinta/80">
      <p className="text-xs text-tinta/60">Fuente</p>
      <p className="font-semibold">Datos de demostración</p>
      <p className="mt-1">
        Los valores no corresponden a mediciones satelitales reales.
        {serie.advertencia ? ` ${serie.advertencia}` : ""}
      </p>
    </div>
  );
}
