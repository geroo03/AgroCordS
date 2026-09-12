import { useState } from 'react';
import { APPLICATION_HISTORY, NDVI_HISTORY } from '../data/mockData';

interface VentanasScreenProps {
  onOpenRegister: () => void;
}

export default function VentanasScreen({ onOpenRegister }: VentanasScreenProps) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [seedingDate, setSeedingDate] = useState('15 Nov 2024');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>('app-1');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownloadActa = (id: string) => {
    setDownloadNotice(`Generando Acta Oficial Fitosanitaria #${id.toUpperCase()} (PDF)...`);
    setTimeout(() => {
      setDownloadNotice('Acta descargada correctamente en el dispositivo.');
      setTimeout(() => setDownloadNotice(null), 3000);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-44 select-none px-4 pt-3">
      {/* SECCIÓN: TÍTULO Y CONTEXTO */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[13px] uppercase tracking-wider text-[#0051d5] font-bold">
            MONITOREO TÉCNICO
          </span>
          <h2 className="text-[20px] font-bold text-[#00236f] tracking-tight">
            Métricas Agronómicas y Vigor (Lote 3)
          </h2>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#eaedff] shadow-extruded-sm flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#00236f] text-[28px]">biotech</span>
        </div>
      </div>

      {/* TARJETA INFORMATIVA: ESTADO DE SIEMBRA */}
      <div className="w-full bg-[#f2f3ff] rounded-xl p-4 shadow-extruded flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#dae2fd] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#00236f] text-[22px]">
              calendar_month
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            {isEditingDate ? (
              <input
                type="text"
                value={seedingDate}
                onChange={(e) => setSeedingDate(e.target.value)}
                className="text-[14px] text-[#00236f] font-bold uppercase bg-white px-2 py-0.5 rounded border border-blue-300"
              />
            ) : (
              <span className="text-[13px] text-[#00236f] font-bold uppercase truncate">
                Siembra: {seedingDate}
              </span>
            )}
            <span className="text-[12px] text-[#444651] leading-tight">
              Ciclo computado automáticamente. Toque para reajustar siembra.
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsEditingDate(!isEditingDate)}
          type="button"
          className="h-10 px-3 bg-[#eaedff] rounded-lg shadow-extruded-sm active:shadow-sunken text-[#00236f] font-bold text-[12px] uppercase shrink-0 cursor-pointer"
        >
          {isEditingDate ? 'Guardar' : 'Editar'}
        </button>
      </div>

      {/* DOS MEDIDORES AGRONÓMICOS NEOMÓRFICOS */}
      <div className="flex flex-col gap-4">
        {/* Medidor 1: GDD */}
        <div className="w-full bg-[#eaedff] rounded-xl p-5 shadow-extruded flex flex-col gap-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[13px] uppercase tracking-wider text-[#444651] font-semibold">
              Grados Día Acumulados (GDD)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0051d5]"></span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-[40px] font-bold text-[#00236f] tracking-tight">1.420</span>
            <span className="text-[20px] text-[#0051d5] font-bold">GDD</span>
          </div>

          {/* Barra de Progreso Térmico */}
          <div className="w-full h-4 bg-[#d2d9f4] rounded-full shadow-sunken p-0.5 my-1 flex">
            <div className="h-full bg-[#00236f] rounded-full transition-all duration-700 w-[68%]"></div>
          </div>

          <div className="bg-[#e2e7ff] rounded-lg p-3 shadow-sunken mt-1 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[#00236f]">
              <span className="material-symbols-outlined text-[18px]">grass</span>
              <span className="text-[13px] font-bold uppercase">Estado Fenológico: R3</span>
            </div>
            <p className="text-[12px] text-[#444651]">
              Base térmica 10°C calculada desde siembra ({seedingDate}). Inicio de llenado de grano
              según gradiente térmico zonal.
            </p>
          </div>
        </div>

        {/* Medidor 2: Agotamiento Hídrico */}
        <div className="w-full bg-[#eaedff] rounded-xl p-5 shadow-extruded flex flex-col gap-1 relative">
          <div className="flex items-center justify-between">
            <span className="text-[13px] uppercase tracking-wider text-[#444651] font-semibold">
              Índice de Agotamiento Hídrico
            </span>
            <span className="text-[12px] text-[#444651] font-semibold">Escala 0 a 1</span>
          </div>

          <div className="flex items-baseline justify-between my-1">
            <div className="flex items-baseline gap-1">
              <span className="text-[40px] font-bold text-[#00236f] tracking-tight">0.38</span>
              <span className="text-[13px] text-[#757682]">/ 1.00</span>
            </div>

            {/* Tag Tonalidad Azul Intermedio */}
            <div className="px-3 py-1 rounded bg-[#0051d5] text-white shadow-extruded-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">water_loss</span>
              <span className="text-[12px] tracking-wider uppercase font-bold">
                ESTRÉS MODERADO
              </span>
            </div>
          </div>

          {/* Barra de agotamiento con rayado táctico SVG */}
          <div className="w-full h-5 bg-[#d2d9f4] rounded shadow-sunken p-0.5 my-1 overflow-hidden relative">
            <svg className="w-full h-full rounded" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="diagonalHatch"
                  patternUnits="userSpaceOnUse"
                  width="8"
                  height="8"
                  patternTransform="rotate(45 0 0)"
                >
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#1e3a8a" strokeWidth="2.5" />
                </pattern>
              </defs>
              <rect width="38%" height="100%" rx="3" fill="#316bf3" />
              <rect width="38%" height="100%" rx="3" fill="url(#diagonalHatch)" opacity="0.35" />
            </svg>
          </div>

          <div className="flex items-center justify-between bg-[#f2f3ff] px-3 py-2 rounded-lg shadow-sunken mt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0051d5] text-[18px]">opacity</span>
              <span className="text-[13px] text-[#131b2e] font-semibold">
                Capacidad de campo útil (0-1m):
              </span>
            </div>
            <span className="text-[14px] text-[#00236f] font-bold">58%</span>
          </div>
        </div>
      </div>

      {/* VIGOR SATELITAL (NDVI / NDRE) */}
      <div className="w-full bg-[#eaedff] rounded-xl p-5 shadow-extruded flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] uppercase tracking-wider text-[#0051d5] font-bold">
              Vigor Espectral de Cultivo
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[36px] font-bold text-[#00236f] tracking-tight leading-none">
                NDVI: 0.74
              </span>
            </div>
            <span className="text-[12px] text-[#757682] mt-1">
              Fuente: Sentinel-2 · Copernicus (Resolución 10m)
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#e2e7ff] shadow-extruded-sm flex items-center gap-1 text-[#00236f]">
            <span className="material-symbols-outlined text-[16px]">north_east</span>
            <span className="text-[14px] font-bold">+0.03</span>
          </div>
        </div>

        {/* Indicador de Confianza Satelital Independiente */}
        <div className="w-full bg-[#f2f3ff] rounded-xl p-3 shadow-sunken flex items-center gap-3">
          {/* Ícono Satélite Claymorphism Puffy SVG */}
          <div className="w-14 h-14 rounded-xl bg-[#dae2fd] shadow-extruded-sm flex items-center justify-center shrink-0 p-1">
            <svg
              className="w-full h-full drop-shadow-sm"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse
                cx="32"
                cy="32"
                rx="26"
                ry="10"
                stroke="#70afff"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                transform="rotate(-25 32 32)"
              />
              <rect x="22" y="22" width="20" height="20" rx="6" fill="#1e3a8a" />
              <rect x="25" y="25" width="14" height="14" rx="4" fill="#316bf3" />
              <rect x="8" y="27" width="10" height="10" rx="2" fill="#d2d9f4" />
              <rect x="46" y="27" width="10" height="10" rx="2" fill="#d2d9f4" />
              <circle cx="32" cy="32" r="3" fill="#ffffff" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#00236f] text-[16px]">verified</span>
              <span className="text-[13px] text-[#00236f] font-bold uppercase tracking-wide">
                Confianza de Medición: ALTA
              </span>
            </div>
            <p className="text-[12px] text-[#444651] leading-tight mt-0.5">
              Cobertura nubosa sobre lote: 0.0% · Pase registrado hace 2 días (14 Feb).
            </p>
          </div>
        </div>

        {/* Gráfico de Línea de 130 Días con Hueco Real por Nubosidad */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[#444651]">
            <span className="text-[12px] uppercase font-bold">Curva Multitemporal (130 días)</span>
            <span className="text-[12px] text-[#757682]">Sin interpolación forzada</span>
          </div>

          <div className="w-full h-36 bg-[#f2f3ff] rounded-xl shadow-sunken p-2 relative overflow-hidden flex flex-col justify-end">
            <div className="absolute inset-x-2 top-4 border-b border-slate-300/40 flex justify-between">
              <span className="text-[10px] text-[#757682] -mt-3">0.80</span>
            </div>
            <div className="absolute inset-x-2 top-16 border-b border-slate-300/40 flex justify-between">
              <span className="text-[10px] text-[#757682] -mt-3">0.60</span>
            </div>
            <div className="absolute inset-x-2 top-28 border-b border-slate-300/40 flex justify-between">
              <span className="text-[10px] text-[#757682] -mt-3">0.40</span>
            </div>

            {/* SVG Gráfico con Rotura/Gap Visual */}
            <svg
              className="w-full h-24 z-10 overflow-visible"
              viewBox="0 0 320 100"
              preserveAspectRatio="none"
            >
              {/* Segmento Previo */}
              <path
                d="M 10 75 Q 40 70 80 55 T 140 40"
                fill="none"
                stroke="#316bf3"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Hueco de Nubosidad */}
              <line
                x1="140"
                y1="40"
                x2="200"
                y2="35"
                stroke="#757682"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Segmento Posterior */}
              <path
                d="M 200 35 Q 250 25 305 18"
                fill="none"
                stroke="#316bf3"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="10" cy="75" r="4" fill="#00236f" />
              <circle cx="80" cy="55" r="4" fill="#00236f" />
              <circle cx="140" cy="40" r="4" fill="#00236f" />
              <circle cx="200" cy="35" r="4" fill="#00236f" />
              <circle cx="305" cy="18" r="5" fill="#00236f" className="animate-pulse" />
            </svg>

            {/* Etiqueta sobre el Gap de Nubosidad */}
            <div className="absolute left-1/2 -translate-x-1/2 top-7 bg-[#dae2fd] px-2 py-0.5 rounded shadow-extruded-sm flex items-center gap-1 z-20 pointer-events-none">
              <span className="material-symbols-outlined text-[12px] text-[#00236f]">
                cloud_off
              </span>
              <span className="text-[10px] text-[#00236f] font-bold uppercase">
                Paso con nubosidad
              </span>
            </div>
          </div>
        </div>

        {/* Chips Interactivos de Fechas Satelitales */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {NDVI_HISTORY.map((item, idx) => {
            const isSelected = selectedDateIndex === idx;
            return (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDateIndex(idx)}
                className={`px-3 py-2 rounded-lg flex flex-col items-center shrink-0 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#dae2fd] shadow-sunken text-[#00236f] font-bold'
                    : item.isCloud
                    ? 'bg-[#d2d9f4] shadow-sunken text-[#757682] opacity-70'
                    : 'bg-[#eaedff] shadow-extruded text-[#444651] active:scale-95'
                }`}
              >
                <span className="text-[12px] font-bold">{item.date}</span>
                <span className="text-[13px] font-bold">
                  {item.isCloud ? 'NUBE' : item.value?.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SCORE DE MANEJO AGROPECUARIO */}
      <div className="w-full bg-[#eaedff] rounded-xl p-5 shadow-extruded flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] uppercase tracking-wider text-[#0051d5] font-bold">
              Auditoría Operativa
            </span>
            <h3 className="text-[18px] font-bold text-[#00236f]">Score de Manejo</h3>
          </div>
          <div className="px-3 py-1 bg-[#dae2fd] rounded text-[#00236f] text-[13px] font-bold uppercase tracking-wider">
            NIVEL: ALTO
          </div>
        </div>

        {/* Medidor Circular Neomórfico */}
        <div className="flex items-center justify-center my-2">
          <div className="w-48 h-48 rounded-full bg-[#eaedff] shadow-extruded flex items-center justify-center p-4 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#d2d9f4" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#00236f"
                strokeWidth="12"
                strokeDasharray="314.15"
                strokeDashoffset="56.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[40px] font-bold text-[#00236f] tracking-tight">82</span>
              <span className="text-[14px] text-[#757682] uppercase font-semibold">de 100</span>
            </div>
          </div>
        </div>

        {/* Aclaración Reglamentaria Excluyente */}
        <div className="bg-[#f2f3ff] p-3 rounded-lg shadow-sunken">
          <p className="text-[12px] text-[#444651] leading-tight italic text-center">
            Métrica ilustrativa de buenas prácticas de pulverización y deriva. No constituye un
            modelo de riesgo agronómico validado.
          </p>
        </div>

        {/* Desglose de Factores Operativos */}
        <div className="flex flex-col gap-2">
          {/* Factor 1 */}
          <div className="w-full bg-[#f2f3ff] p-3 rounded-xl shadow-extruded-sm flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#dae2fd] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#00236f] text-[20px]">
                  water_drop
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] text-[#131b2e] font-semibold truncate">
                  Ventana Óptima
                </span>
                <span className="text-[11px] text-[#757682]">Oportunidad de aplicación</span>
              </div>
            </div>
            <span className="text-[18px] text-[#00236f] font-bold">
              90<span className="text-[13px] text-[#757682] font-normal">/100</span>
            </span>
          </div>

          {/* Factor 2 */}
          <div className="w-full bg-[#f2f3ff] p-3 rounded-xl shadow-extruded-sm flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#dae2fd] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#00236f] text-[20px]">air</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] text-[#131b2e] font-semibold truncate">
                  Control de Deriva
                </span>
                <span className="text-[11px] text-[#757682]">Puntas y velocidad cabina</span>
              </div>
            </div>
            <span className="text-[18px] text-[#00236f] font-bold">
              85<span className="text-[13px] text-[#757682] font-normal">/100</span>
            </span>
          </div>

          {/* Factor 3 */}
          <div className="w-full bg-[#f2f3ff] p-3 rounded-xl shadow-extruded-sm flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#dae2fd] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#00236f] text-[20px]">speed</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] text-[#131b2e] font-semibold truncate">
                  Estrés Hídrico
                </span>
                <span className="text-[11px] text-[#757682]">Monitoreo de evaporación</span>
              </div>
            </div>
            <span className="text-[18px] text-[#00236f] font-bold">
              72<span className="text-[13px] text-[#757682] font-normal">/100</span>
            </span>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE APLICACIONES REGISTRADAS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-[#00236f]">Historial en Lote</h3>
          <span className="text-[12px] text-[#0051d5] font-bold uppercase tracking-wider">
            2 Campañas
          </span>
        </div>

        {downloadNotice && (
          <div className="p-3 rounded-lg bg-[#00236f] text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-pulse">
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>{downloadNotice}</span>
          </div>
        )}

        {APPLICATION_HISTORY.map((rec) => {
          const isExpanded = expandedRecord === rec.id;
          return (
            <div
              key={rec.id}
              className="w-full bg-[#eaedff] rounded-xl shadow-extruded transition-all overflow-hidden"
            >
              <div
                onClick={() => setExpandedRecord(isExpanded ? null : rec.id)}
                className="p-4 flex items-center justify-between cursor-pointer active:bg-[#e2e7ff] transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#00236f] font-bold">
                      {rec.date} · {rec.time}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5]"></span>
                    <span className="text-[12px] text-[#757682]">{rec.hectares} ha</span>
                  </div>
                  <span className="text-[14px] text-[#131b2e] font-semibold truncate mt-0.5">
                    {rec.title}
                  </span>
                </div>
                <div
                  className={`w-9 h-9 rounded-lg bg-[#e2e7ff] shadow-extruded-sm flex items-center justify-center shrink-0 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[#00236f] text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Expanded Frozen Environmental Telemetry */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3 bg-[#f2f3ff]">
                  <span className="text-[12px] text-[#757682] uppercase font-semibold">
                    Condiciones Ambientales Congeladas:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Viento */}
                    <div className="bg-[#eaedff] p-3 rounded-lg shadow-sunken flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#dae2fd] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#00236f] text-[18px]">
                          air
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-[#757682] uppercase font-bold">
                          Viento
                        </span>
                        <span className="text-[13px] text-[#00236f] font-bold truncate">
                          {rec.wind}
                        </span>
                      </div>
                    </div>

                    {/* Temp */}
                    <div className="bg-[#eaedff] p-3 rounded-lg shadow-sunken flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#dae2fd] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#00236f] text-[18px]">
                          device_thermostat
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-[#757682] uppercase font-bold">
                          Temperatura
                        </span>
                        <span className="text-[13px] text-[#00236f] font-bold truncate">
                          {rec.temp}
                        </span>
                      </div>
                    </div>

                    {/* Delta T */}
                    <div className="bg-[#eaedff] p-3 rounded-lg shadow-sunken flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0051d5] text-[22px] ml-1">
                        thermostat_auto
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-[#757682] uppercase font-bold">
                          Delta T
                        </span>
                        <span className="text-[13px] text-[#00236f] font-bold truncate">
                          {rec.deltaT}
                        </span>
                      </div>
                    </div>

                    {/* Humedad */}
                    <div className="bg-[#eaedff] p-3 rounded-lg shadow-sunken flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0051d5] text-[22px] ml-1">
                        humidity_mid
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-[#757682] uppercase font-bold">
                          Humedad
                        </span>
                        <span className="text-[13px] text-[#00236f] font-bold truncate">
                          {rec.humidity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[12px] text-[#444651] font-medium">
                      Operador: {rec.operator}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadActa(rec.id)}
                      className="text-[12px] text-[#00236f] font-bold underline cursor-pointer"
                    >
                      Descargar Acta
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTÓN DE ACCIÓN TÁCTICA ERGONÓMICO */}
      <div className="w-full mt-2">
        <button
          type="button"
          onClick={onOpenRegister}
          className="w-full h-16 rounded-xl bg-[#00236f] text-white shadow-extruded active:shadow-sunken active:bg-[#1e3a8a] flex items-center justify-center gap-3 transition-all duration-150 font-bold uppercase tracking-wider text-[15px] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">note_add</span>
          <span>REGISTRAR NUEVA APLICACIÓN</span>
        </button>
      </div>

      {/* AVISO LEGAL PERENNE AL PIE */}
      <div className="w-full bg-[#f2f3ff] p-3 rounded-lg shadow-sunken flex flex-col gap-1">
        <span className="text-[11px] font-bold text-[#00236f] tracking-wider uppercase font-mono">
          [RESOLUCIÓN Y NORMATIVAS PROVINCIALES VIGENTES]
        </span>
        <p className="text-[12px] text-[#444651] leading-tight">
          Responsabilidad técnica sujeta a validación a campo por profesional agrónomo matriculado.
          Los datos satelitales y cálculos de balance térmico-hídrico son aproximaciones numéricas
          no eximentes de fiscalización in-situ.
        </p>
      </div>
    </div>
  );
}
