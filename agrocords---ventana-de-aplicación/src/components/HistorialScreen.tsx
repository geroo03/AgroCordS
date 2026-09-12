import { useState } from 'react';
import { FontSizeScale } from '../types';

interface HistorialScreenProps {
  fontSizeScale: FontSizeScale;
  onChangeFontSize: (scale: FontSizeScale) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  soundAlerts: boolean;
  onToggleSoundAlerts: () => void;
}

export default function HistorialScreen({
  fontSizeScale,
  onChangeFontSize,
  highContrast,
  onToggleHighContrast,
  soundAlerts,
  onToggleSoundAlerts
}: HistorialScreenProps) {
  const [demoActivated, setDemoActivated] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  const previewFontClasses: Record<FontSizeScale, string> = {
    chico: 'text-[15px]',
    mediano: 'text-[18px]',
    grande: 'text-[22px]',
    extra: 'text-[26px]'
  };

  const handleCopyTx = () => {
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-44 select-none px-4 pt-3">
      {/* Section 1: Ventanas Próximas en Todos los Lotes */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[20px]">
              calendar_view_week
            </span>
            <h2 className="text-[19px] font-bold text-[#00236f] tracking-tight">
              VENTANAS PRÓXIMAS
            </h2>
          </div>
          <span className="text-[12px] text-[#444651] uppercase tracking-wider font-semibold">
            3 lotes activos
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Tarjeta 1: Lote 3 */}
          <div className="bg-[#eaedff] rounded-xl p-4 shadow-extruded flex flex-col gap-1.5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#00236f] tracking-wide">
                  LOTE 3 - EL OMBÚ
                </span>
                <span className="text-[13px] text-[#0051d5] font-semibold mt-0.5">
                  Mañana 04:00 a 09:00 hs (5 hrs)
                </span>
              </div>
              <span className="bg-[#316bf3] text-white px-3 py-1 rounded-full text-[12px] font-bold tracking-wider">
                ÓPTIMA
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#e2e7ff] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#0051d5] w-full"></div>
            </div>
            <div className="flex items-center justify-between text-[#444651] text-[12px] pt-1 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#00236f]">air</span>{' '}
                Viento 8-12 km/h
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#00236f]">
                  thermostat
                </span>{' '}
                Delta-T 3.2 a 4.1
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Lote 1 */}
          <div className="bg-[#eaedff] rounded-xl p-4 shadow-extruded flex flex-col gap-1.5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#00236f] tracking-wide">
                  LOTE 1 - BAJO NORTE
                </span>
                <span className="text-[13px] text-[#0051d5] font-semibold mt-0.5">
                  Mañana 06:00 a 11:00 hs (5 hrs)
                </span>
              </div>
              <span className="bg-[#e2e7ff] text-[#00236f] px-3 py-1 rounded-full text-[12px] font-bold tracking-wider">
                FAVORABLE
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#e2e7ff] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#316bf3] w-4/5"></div>
            </div>
            <div className="flex items-center justify-between text-[#444651] text-[12px] pt-1 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#00236f]">air</span>{' '}
                Viento 10-14 km/h
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#00236f]">
                  thermostat
                </span>{' '}
                Delta-T 4.0
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Lote 4 */}
          <div className="bg-[#00236f] text-white rounded-xl p-4 shadow-extruded flex flex-col gap-1.5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-white tracking-wide">
                  LOTE 4 - EL TRÉBOL
                </span>
                <span className="text-[13px] text-[#dbe1ff] mt-0.5">
                  Pasado mañana 05:00 a 10:00 hs
                </span>
              </div>
              <span className="bg-white text-[#00236f] px-3 py-1 rounded-full text-[12px] font-bold tracking-wider">
                AL LÍMITE
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#1e3a8a] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#dbe1ff] w-1/2"></div>
            </div>
            <div className="flex items-center justify-between text-[#dae2fd] text-[12px] pt-1 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#dbe1ff]">
                  warning
                </span>{' '}
                Ráfagas térmicas desde 09:30
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#dbe1ff]">
                  schedule
                </span>{' '}
                4.5 hrs útiles
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Plan Agro Pro / Paywall Agro */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[20px]">
              workspace_premium
            </span>
            <h2 className="text-[19px] font-bold text-[#00236f] tracking-tight">PLAN AGRO PRO</h2>
          </div>
          <span className="text-[12px] font-bold bg-[#dbe1ff] text-[#00236f] px-2 py-0.5 rounded">
            V2.4
          </span>
        </div>

        {/* Comparativa Neomórfica */}
        <div className="bg-[#eaedff] rounded-xl p-4 shadow-extruded flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Gratuito */}
            <div className="bg-[#f2f3ff] p-3 rounded-lg flex flex-col gap-1">
              <span className="text-[12px] text-[#444651] uppercase tracking-wider font-semibold">
                Básico
              </span>
              <span className="text-[20px] font-bold text-[#131b2e]">Gratis</span>
              <div className="flex flex-col gap-1 mt-1 text-[#444651] text-[12px]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check</span> Ventana 24 hs
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check</span> 1 solo lote
                </span>
                <span className="flex items-center gap-1 text-[#757682]">
                  <span className="material-symbols-outlined text-[14px]">close</span> Inversión
                  térmica
                </span>
                <span className="flex items-center gap-1 text-[#757682]">
                  <span className="material-symbols-outlined text-[14px]">close</span> Sentinel-2
                  puro
                </span>
              </div>
            </div>

            {/* Agro Pro */}
            <div className="bg-[#dae2fd] p-3 rounded-lg shadow-sunken flex flex-col gap-1">
              <span className="text-[12px] text-[#00236f] uppercase tracking-wider font-bold">
                Agro Pro
              </span>
              <span className="text-[20px] font-bold text-[#00236f]">
                25 USDC
                <span className="text-[12px] font-normal text-[#444651]">/mes</span>
              </span>
              <div className="flex flex-col gap-1 mt-1 text-[#00236f] text-[12px] font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">done_all</span> Ventana 72
                  hs
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">done_all</span> Multi-lote
                  ilimitado
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">done_all</span> Inversión
                  térmica
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">done_all</span> Sentinel-2
                  puro
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">done_all</span> Reporte
                  agrónomo PDF
                </span>
              </div>
            </div>
          </div>

          {/* Botón Gigante (68px alto) */}
          <button
            onClick={() => setDemoActivated(true)}
            type="button"
            className="w-full h-[68px] min-h-[68px] bg-[#1e3a8a] text-white rounded-xl text-[14px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-extruded transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">
              {demoActivated ? 'check_circle' : 'verified'}
            </span>
            <span>
              {demoActivated ? 'DEMO AGRO PRO ACTIVA (14 DÍAS)' : 'ACTIVAR DEMO AGRO PRO - 14 DÍAS'}
            </span>
          </button>
        </div>

        {/* Vía Web3 / Base */}
        <div className="bg-[#e2e7ff] rounded-xl p-4 shadow-extruded flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-extruded shrink-0">
              <span className="material-symbols-outlined text-[#00236f] text-[28px]">
                account_balance_wallet
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-bold text-[#00236f] truncate">
                PAGO CON STABLECOIN
              </span>
              <span className="text-[12px] text-[#444651]">USDC nativo en Red Base</span>
            </div>
          </div>

          <div className="bg-[#eaedff] p-3 rounded-lg flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-[#444651]">Suscripción por establecimiento</span>
              <span className="text-[18px] font-bold text-[#00236f]">
                25 USDC <span className="text-[14px] font-normal text-[#444651]">/ mes</span>
              </span>
            </div>
            <span className="material-symbols-outlined text-[#0051d5] text-[32px]">toll</span>
          </div>

          {/* Hash de Verificación */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#444651] uppercase tracking-wider font-semibold">
              Última verificación de nodo:
            </span>
            <div className="bg-white px-3 py-2 rounded flex items-center justify-between text-[12px] shadow-sunken">
              <span className="font-mono text-[#00236f] font-semibold">
                Tx: 0x4f8a...c93b {copiedTx && '✓ Copiado'}
              </span>
              <button
                type="button"
                onClick={handleCopyTx}
                className="text-[#0051d5] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                BaseScan <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
              </button>
            </div>
          </div>

          {/* Advertencia Irreversible */}
          <div className="bg-white p-3 rounded-lg flex items-start gap-2 shadow-sunken">
            <span className="material-symbols-outlined text-[#00236f] text-[18px] shrink-0 mt-0.5">
              lock
            </span>
            <p className="text-[12px] text-[#444651] leading-tight">
              <strong className="text-[#131b2e] font-semibold">Atención:</strong> Las transferencias
              en blockchain son definitivas e irreversibles. La acreditación de la licencia es
              instantánea una vez confirmada la transacción en la red Base.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Ajustes y Accesibilidad para el Campo */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00236f] text-[20px]">tune</span>
          <h2 className="text-[19px] font-bold text-[#00236f] tracking-tight">AJUSTES DE CAMPO</h2>
        </div>

        <div className="bg-[#eaedff] rounded-xl p-4 shadow-extruded flex flex-col gap-4">
          {/* Selector de Tipografía */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] text-[#131b2e] uppercase tracking-wider font-bold">
              Tamaño de Tipografía (Legibilidad en Cabina)
            </label>
            <div className="grid grid-cols-4 gap-2 h-14" id="font-size-group">
              {(
                [
                  { id: 'chico', label: 'Chico' },
                  { id: 'mediano', label: 'Med' },
                  { id: 'grande', label: 'Grande' },
                  { id: 'extra', label: 'X-Gde' }
                ] as const
              ).map((f) => {
                const isActive = fontSizeScale === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onChangeFontSize(f.id)}
                    type="button"
                    className={`h-full rounded-lg text-[13px] flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#dae2fd] shadow-sunken text-[#00236f] font-bold'
                        : 'bg-[#eaedff] shadow-extruded text-[#131b2e] hover:text-[#00236f]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Muestra dinámica */}
            <div className="bg-[#f2f3ff] p-3 rounded-lg shadow-sunken mt-1">
              <span className="text-[11px] text-[#444651] block mb-1">
                Muestra de lectura dinámica:
              </span>
              <p
                className={`${previewFontClasses[fontSizeScale]} font-bold text-[#00236f] transition-all duration-150`}
              >
                Delta-T: 3.8 · Viento: 11 km/h NE
              </p>
            </div>
          </div>

          {/* Toggle: Alto Contraste para Pleno Sol */}
          <div className="h-16 flex items-center justify-between bg-[#f2f3ff] px-4 rounded-xl shadow-sunken">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00236f] text-[22px]">
                light_mode
              </span>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-[#131b2e]">
                  Alto Contraste (Pleno Sol)
                </span>
                <span className="text-[11px] text-[#444651]">
                  Realza bordes y valores numéricos
                </span>
              </div>
            </div>
            <button
              onClick={onToggleHighContrast}
              type="button"
              className={`w-14 h-8 rounded-full relative transition-colors shadow-sunken flex items-center px-1 cursor-pointer ${
                highContrast ? 'bg-[#00236f]' : 'bg-[#dae2fd]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full bg-white shadow-extruded transform transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {/* Toggle: Notificaciones de Ventana Óptima */}
          <div className="h-16 flex items-center justify-between bg-[#f2f3ff] px-4 rounded-xl shadow-sunken">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00236f] text-[22px]">
                notifications_active
              </span>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-[#131b2e]">
                  Notificar Ventana Óptima
                </span>
                <span className="text-[11px] text-[#444651]">Alerta sonora en pulverizadora</span>
              </div>
            </div>
            <button
              onClick={onToggleSoundAlerts}
              type="button"
              className={`w-14 h-8 rounded-full relative transition-colors shadow-sunken flex items-center px-1 cursor-pointer ${
                soundAlerts ? 'bg-[#00236f]' : 'bg-[#dae2fd]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full bg-white shadow-extruded transform transition-transform ${
                  soundAlerts ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>
        </div>
      </section>

      {/* Aviso Legal Perenne al Pie */}
      <div className="bg-[#f2f3ff] p-3 rounded-lg shadow-sunken flex items-start gap-2">
        <span className="material-symbols-outlined text-[#757682] text-[18px] shrink-0 mt-0.5">
          verified_user
        </span>
        <p className="text-[12px] text-[#444651] leading-tight">
          <strong className="font-semibold text-[#131b2e]">AVISO LEGAL:</strong> Describe
          condiciones meteorológicas calculadas mediante sensores y teledetección. No reemplaza la
          receta de aplicación emitida por el profesional agrónomo matriculado.
        </p>
      </div>
    </div>
  );
}
