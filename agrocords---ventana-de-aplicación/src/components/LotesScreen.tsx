import { useState } from 'react';
import { Lot, FontSizeScale } from '../types';

interface LotesScreenProps {
  lots: Lot[];
  onSelectLotDetail: (lot: Lot) => void;
  onOpenNewLot: () => void;
  onLoadExamples: () => void;
  fontSizeScale: FontSizeScale;
  onChangeFontSize: (scale: FontSizeScale) => void;
  onAdjustNozzles: (lot: Lot) => void;
  onViewLog: (lot: Lot) => void;
}

export default function LotesScreen({
  lots,
  onSelectLotDetail,
  onOpenNewLot,
  onLoadExamples,
  fontSizeScale,
  onChangeFontSize,
  onAdjustNozzles,
  onViewLog
}: LotesScreenProps) {
  const [showOverlapError, setShowOverlapError] = useState(true);

  return (
    <div className="flex flex-col w-full gap-5 pb-44 select-none px-4 pt-3">
      {/* Telemetry Subheader Card */}
      <section className="w-full bg-white rounded-xl shadow-extruded p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00236f]">domain</span>
            <span className="text-[13px] tracking-wider uppercase text-[#00236f] font-bold">
              ESTABLECIMIENTO LA POSTA
            </span>
          </div>
          <span className="text-[12px] text-[#444651]">Pergamino, Bs. As.</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <h2 className="text-[20px] font-bold text-[#131b2e] tracking-tight">
            {lots.length} Lotes Monitoreados
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#e2e7ff] text-[#00236f] font-semibold">
            100% TELEMETRÍA OK
          </span>
        </div>
      </section>

      {/* Large Action Controls (Min 64px) */}
      <section className="flex flex-col gap-3 w-full">
        <button
          onClick={onOpenNewLot}
          type="button"
          className="w-full h-16 rounded-xl bg-[#1e3a8a] text-white shadow-extruded flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer font-bold tracking-wider uppercase text-[15px]"
        >
          <span className="material-symbols-outlined text-[24px]">polyline</span>
          <span>+ NUEVO LOTE (TRAZAR POLÍGONO)</span>
        </button>

        <button
          onClick={onLoadExamples}
          type="button"
          className="w-full h-16 rounded-xl bg-white text-[#00236f] shadow-extruded flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer font-bold tracking-wider uppercase text-[15px] border border-slate-200/80"
        >
          <span className="material-symbols-outlined text-[24px] text-[#00236f]">
            cloud_download
          </span>
          <span>CARGAR LOTES DE EJEMPLO</span>
        </button>
      </section>

      {/* Inline Error Boundary Simulation */}
      {showOverlapError && (
        <section className="w-full bg-[#f2f3ff] rounded-xl shadow-sunken p-4 flex flex-col gap-3 relative">
          <div className="flex items-start gap-3">
            {/* 3D Puffy Claymorphism Alert Token */}
            <div
              className="w-12 h-12 rounded-full shadow-extruded-sm flex items-center justify-center shrink-0"
              style={{
                background:
                  'radial-gradient(circle at 35% 35%, #ffffff 0%, #dae2fd 55%, #1e3a8a 120%)',
                boxShadow:
                  'inset -2px -2px 5px rgba(30, 58, 138, 0.35), inset 3px 3px 6px rgba(255, 255, 255, 0.95), 4px 4px 8px rgba(160, 175, 200, 0.35)'
              }}
            >
              <span
                className="material-symbols-outlined text-[#00236f] text-[24px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                priority_high
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[13px] uppercase tracking-wide text-[#00236f] font-bold">
                  ERROR DE TRAZADO: SUPERPOSICIÓN DETECTADA (&gt;10%)
                </span>
                <button
                  onClick={() => setShowOverlapError(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Cerrar aviso"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <p className="text-[14px] text-[#444651] mt-1 leading-snug">
                El polígono dibujado se superpone 14.2% con el{' '}
                <strong className="font-semibold text-[#131b2e]">"Lote 2 - La Ribera"</strong>.
                Ajustá los vértices perimetrales o confirmá la partición catastral.
              </p>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-[#dae2fd] shadow-sunken overflow-hidden mt-1">
            <div className="h-full bg-[#00236f] w-[72%] rounded-full"></div>
          </div>

          <button
            onClick={onOpenNewLot}
            type="button"
            className="w-full h-14 rounded-xl bg-[#eaedff] text-[#00236f] shadow-extruded flex items-center justify-center gap-2 mt-1 active:scale-[0.98] transition-transform font-bold tracking-wider uppercase text-[14px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">gesture</span>
            <span>REINTENTAR TRAZADO</span>
          </button>
        </section>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[15px] text-[#00236f] uppercase tracking-widest font-bold">
          CATÁLOGO DE LOTES ACTIVOS
        </span>
        <span className="text-[12px] text-[#444651] font-medium">3 EN SEGUIMIENTO</span>
      </div>

      {/* Cards List */}
      <section className="flex flex-col gap-4 w-full">
        {/* Card 1: Lote 3 - El Ombú (Favorables) */}
        <article className="w-full bg-white rounded-xl shadow-extruded p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <h3 className="text-[18px] font-bold text-[#131b2e] tracking-tight truncate">
                Lote 3 - El Ombú
              </h3>
              <span className="text-[14px] text-[#444651]">185 ha · Soja 1ra</span>
            </div>
            {/* Schematic Polygon Vector Thumbnail */}
            <div className="w-16 h-16 rounded-lg bg-[#f2f3ff] shadow-sunken flex items-center justify-center shrink-0 p-1">
              <svg className="w-full h-full" fill="none" viewBox="0 0 60 60">
                <polygon
                  fill="#dae2fd"
                  fillOpacity="0.45"
                  points="12,14 48,10 52,46 22,52 8,36"
                  stroke="#00236f"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
                <circle cx="12" cy="14" fill="#00236f" r="2.5" />
                <circle cx="48" cy="10" fill="#00236f" r="2.5" />
                <circle cx="52" cy="46" fill="#00236f" r="2.5" />
                <circle cx="22" cy="52" fill="#00236f" r="2.5" />
                <circle cx="8" cy="36" fill="#00236f" r="2.5" />
              </svg>
            </div>
          </div>

          {/* State: Blue Soft Striated Tint */}
          <div
            className="w-full rounded-xl p-4 bg-[#dae2fd] shadow-extruded-sm flex flex-col gap-1.5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.45), rgba(255,255,255,0.45) 8px, transparent 8px, transparent 16px)'
            }}
          >
            <div className="flex items-center gap-3">
              {/* Claymorphism Wind Drop Token */}
              <div
                className="w-11 h-11 rounded-full shadow-extruded-sm flex items-center justify-center shrink-0"
                style={{ background: 'radial-gradient(circle at 30% 30%, #ffffff, #dce1ff 70%)' }}
              >
                <span
                  className="material-symbols-outlined text-[#00236f] text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  air
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#00236f] tracking-widest uppercase">
                  VENTANA PULVERIZACIÓN
                </span>
                <span className="text-[18px] text-[#00236f] tracking-tight font-bold">
                  CONDICIONES FAVORABLES
                </span>
              </div>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#00236f]">verified</span>
              <p className="text-[14px] text-[#00236f] font-medium">
                Viento 11 km/h · Delta-T 4.2 · Sin pronóstico de lluvia
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[12px] text-[#444651] font-semibold">
              ESTACIÓN PERGAMINO CENTRO
            </span>
            <button
              onClick={() => {
                const target = lots.find((l) => l.id === 'lote-3') || lots[0];
                onSelectLotDetail(target);
              }}
              type="button"
              className="h-10 px-4 rounded-lg bg-[#eaedff] text-[#00236f] text-[13px] font-bold shadow-extruded-sm flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>VER DETALLE</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </article>

        {/* Card 2: Lote 1 - Bajo Norte (Al Límite) */}
        <article className="w-full bg-white rounded-xl shadow-extruded p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <h3 className="text-[18px] font-bold text-[#131b2e] tracking-tight truncate">
                Lote 1 - Bajo Norte
              </h3>
              <span className="text-[14px] text-[#444651]">92 ha · Maíz Tardío</span>
            </div>
            {/* Schematic Polygon Vector Thumbnail */}
            <div className="w-16 h-16 rounded-lg bg-[#f2f3ff] shadow-sunken flex items-center justify-center shrink-0 p-1">
              <svg className="w-full h-full" fill="none" viewBox="0 0 60 60">
                <polygon
                  fill="#dae2fd"
                  fillOpacity="0.4"
                  points="8,10 52,14 42,48 16,50"
                  stroke="#00236f"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
                <circle cx="8" cy="10" fill="#00236f" r="2.5" />
                <circle cx="52" cy="14" fill="#00236f" r="2.5" />
                <circle cx="42" cy="48" fill="#00236f" r="2.5" />
                <circle cx="16" cy="50" fill="#00236f" r="2.5" />
              </svg>
            </div>
          </div>

          {/* State: Intermediate Blue Dual Striped */}
          <div
            className="w-full rounded-xl p-4 bg-[#e2e7ff] shadow-extruded-sm flex flex-col gap-1.5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(30, 58, 138, 0.08), rgba(30, 58, 138, 0.08) 6px, transparent 6px, transparent 14px)'
            }}
          >
            <div className="flex items-center gap-3">
              {/* Claymorphism Wind Surge Token */}
              <div
                className="w-11 h-11 rounded-full shadow-extruded-sm flex items-center justify-center shrink-0"
                style={{ background: 'radial-gradient(circle at 30% 30%, #ffffff, #b4c5ff 80%)' }}
              >
                <span
                  className="material-symbols-outlined text-[#00236f] text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  speed
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#00236f] tracking-widest uppercase">
                  TOLERANCIA OPERATIVA
                </span>
                <span className="text-[18px] text-[#00236f] tracking-tight font-bold">
                  AL LÍMITE
                </span>
              </div>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#00236f]">warning</span>
              <p className="text-[14px] text-[#00236f] font-medium">
                Ráfagas a 24 km/h en incremento · Humedad relativa 42%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[12px] text-[#444651] font-semibold">
              DERIVA: RIESGO MODERADO
            </span>
            <button
              onClick={() => {
                const target = lots.find((l) => l.id === 'lote-1') || lots[0];
                onAdjustNozzles(target);
              }}
              type="button"
              className="h-10 px-4 rounded-lg bg-[#eaedff] text-[#00236f] text-[13px] font-bold shadow-extruded-sm flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>AJUSTAR PICOS</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </article>

        {/* Card 3: Lote 4 - El Trébol (No Favorables) */}
        <article className="w-full bg-white rounded-xl shadow-extruded p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <h3 className="text-[18px] font-bold text-[#131b2e] tracking-tight truncate">
                Lote 4 - El Trébol
              </h3>
              <span className="text-[14px] text-[#444651]">240 ha · Girasol</span>
            </div>
            {/* Schematic Polygon Vector Thumbnail */}
            <div className="w-16 h-16 rounded-lg bg-[#f2f3ff] shadow-sunken flex items-center justify-center shrink-0 p-1">
              <svg className="w-full h-full" fill="none" viewBox="0 0 60 60">
                <polygon
                  fill="#dae2fd"
                  fillOpacity="0.35"
                  points="18,10 46,14 54,34 38,52 14,44 6,24"
                  stroke="#00236f"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
                <circle cx="18" cy="10" fill="#00236f" r="2.5" />
                <circle cx="46" cy="14" fill="#00236f" r="2.5" />
                <circle cx="54" cy="34" fill="#00236f" r="2.5" />
                <circle cx="38" cy="52" fill="#00236f" r="2.5" />
                <circle cx="14" cy="44" fill="#00236f" r="2.5" />
                <circle cx="6" cy="24" fill="#00236f" r="2.5" />
              </svg>
            </div>
          </div>

          {/* State: Deep Navy Midnight Card */}
          <div className="w-full rounded-xl p-4 bg-[#283044] text-[#eef0ff] shadow-extruded flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              {/* Claymorphism Inversion Token */}
              <div
                className="w-11 h-11 rounded-full shadow-extruded-sm flex items-center justify-center shrink-0"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #70afff 0%, #002b52 80%)'
                }}
              >
                <span
                  className="material-symbols-outlined text-white text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  block
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#b6c4ff] uppercase tracking-widest">
                  BLOQUEO ESTRICTO
                </span>
                <span className="text-[18px] text-white tracking-tight font-bold">
                  CONDICIONES NO FAVORABLES
                </span>
              </div>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#b6c4ff]">cyclone</span>
              <p className="text-[14px] text-slate-200 font-medium leading-snug">
                Inversión térmica activa (humo atrapado a ras de suelo) y ráfagas &gt; 32 km/h.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[12px] text-[#444651] font-semibold">
              DERIVA INCONTROLABLE
            </span>
            <button
              onClick={() => {
                const target = lots.find((l) => l.id === 'lote-4') || lots[0];
                onViewLog(target);
              }}
              type="button"
              className="h-10 px-4 rounded-lg bg-[#eaedff] text-[#00236f] text-[13px] font-bold shadow-extruded-sm flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>VER BITÁCORA</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </article>
      </section>

      {/* Quick Typography Size Control Module */}
      <section className="w-full bg-[#f2f3ff] rounded-xl shadow-extruded p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[20px]">
              format_size
            </span>
            <span className="text-[13px] uppercase tracking-wider text-[#00236f] font-bold">
              ACCESIBILIDAD EN CABINA
            </span>
          </div>
          <span className="text-[12px] text-[#444651]">TAMAÑO TIPOGRÁFICO</span>
        </div>

        {/* Segmented Neumorphic Pill Controller */}
        <div className="grid grid-cols-4 gap-1.5 bg-[#dae2fd] p-1 rounded-xl shadow-sunken">
          {(['chico', 'mediano', 'grande', 'extra'] as FontSizeScale[]).map((scale) => {
            const labels: Record<FontSizeScale, string> = {
              chico: 'Chico',
              mediano: 'Mediano',
              grande: 'Grande',
              extra: 'Extra'
            };
            const isActive = fontSizeScale === scale;
            return (
              <button
                key={scale}
                onClick={() => onChangeFontSize(scale)}
                type="button"
                className={`h-12 rounded-lg flex items-center justify-center text-[13px] transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#00236f] shadow-extruded-sm font-bold'
                    : 'text-[#131b2e] hover:text-[#00236f]'
                }`}
              >
                {labels[scale]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Permanent Legal Notice Card */}
      <section className="w-full bg-[#f2f3ff] rounded-xl shadow-sunken p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#757682] text-[20px] shrink-0 mt-0.5">
          policy
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] uppercase tracking-wide text-[#00236f] font-bold">
            [RESOLUCIÓN Y NORMATIVAS PROVINCIALES VIGENTES]
          </span>
          <p className="text-[12px] text-[#444651] leading-relaxed">
            <strong>AVISO LEGAL:</strong> Describe condiciones calculadas. No reemplaza la receta
            del profesional agrónomo matriculado ni la constatación con anemómetro de campo al
            momento del inicio del botalón.
          </p>
        </div>
      </section>
    </div>
  );
}
