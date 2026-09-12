import { useState } from 'react';
import { Lot } from '../types';
import { TIMELINE_BLOCKS } from '../data/mockData';

interface DetalleLoteScreenProps {
  lot: Lot;
  onBack: () => void;
  onRegisterSuccess: (lotName: string) => void;
}

export default function DetalleLoteScreen({
  lot,
  onBack,
  onRegisterSuccess
}: DetalleLoteScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<'HERBICIDAS' | 'INSECTICIDAS' | 'FUNGICIDAS'>('HERBICIDAS');
  const [activeIngredient, setActiveIngredient] = useState('Glifosato 66% + 2,4-D Enlist');
  const [commercialName, setCommercialName] = useState('Enlist Colex-D + Coadyuvante Antideriva');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const ingredientOptions: Record<'HERBICIDAS' | 'INSECTICIDAS' | 'FUNGICIDAS', string[]> = {
    HERBICIDAS: [
      'Glifosato 66% + 2,4-D Enlist',
      'Cletodim 24% + Coadyuvante Metilado',
      'Fomesafen 25% + Benazolín',
      'Atrazina 50% + S-Metolacloro'
    ],
    INSECTICIDAS: [
      'Clorantraniliprole 20% (Rynaxypyr)',
      'Bifentrin 10% + Imidacloprid',
      'Benzoato de Emamectina 5%'
    ],
    FUNGICIDAS: [
      'Azoxistrobina 20% + Ciproconazol 8%',
      'Trifloxistrobina + Protioconazol',
      'Epoxiconazol + Piraclostrobina'
    ]
  };

  const handleRegister = () => {
    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      setRegisteredSuccess(true);
      setTimeout(() => {
        setRegisteredSuccess(false);
        onRegisterSuccess(lot.name);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full px-4 pt-3 pb-44 bg-[#faf8ff] select-none">
      {/* 1. Header Lote */}
      <section className="w-full pb-4">
        <div className="bg-[#eaedff] rounded-xl p-4 shadow-extruded-sm flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[20px] text-[#00236f] font-bold tracking-tight">
              {lot.name}
            </span>
            <span className="text-[13px] font-semibold px-2 py-0.5 rounded bg-[#dae2fd] text-[#444651]">
              {lot.hectares} ha
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#757682] text-[13px]">
            <span className="font-semibold text-[#131b2e]">{lot.crop} ({lot.stage})</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">sensors</span>
              Estación: hace 12 min
            </span>
          </div>
        </div>
      </section>

      {/* 2. Frase Grande de Decisión Actual & Impacto Económico */}
      <section className="w-full pb-6">
        <div className="bg-white rounded-xl p-5 shadow-extruded flex flex-col gap-4">
          {/* Top Tactical Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f2f3ff] to-[#dae2fd] shadow-extruded-sm flex items-center justify-center relative overflow-hidden">
                <div className="absolute -top-2 -left-2 w-7 h-7 bg-white/80 rounded-full blur-[2px]"></div>
                <span className="material-symbols-outlined text-[#00236f] text-[28px]">air</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] uppercase tracking-wider text-[#757682] font-semibold">
                  DIAGNÓSTICO IN SITU
                </span>
                <div className="flex items-center gap-1 text-[#0051d5] text-[13px] font-bold">
                  <span className="text-[12px]">◆</span>
                  <span>VENTANA ABIERTA</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#e2e7ff] rounded text-[#00236f] text-[13px] font-bold tracking-wider">
              LOTE 03
            </span>
          </div>

          {/* Main Decision Headline */}
          <div className="flex flex-col gap-1">
            <h2 className="text-[32px] sm:text-[38px] font-black text-[#00236f] tracking-tight leading-tight uppercase">
              CONDICIONES FAVORABLES
            </h2>
            <p className="text-[15px] text-[#444651] font-medium pt-1">
              Viento laminar 12 km/h SE · Delta-T 4.8 · Inversión térmica nula
            </p>
          </div>

          {/* Quick Operational Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-[#f2f3ff] rounded-lg p-2.5 shadow-sunken flex flex-col">
              <span className="text-[11px] text-[#757682] uppercase font-semibold">VIENTO</span>
              <span className="text-[20px] text-[#00236f] font-bold">
                12 <span className="text-[12px] font-normal">km/h</span>
              </span>
            </div>
            <div className="bg-[#f2f3ff] rounded-lg p-2.5 shadow-sunken flex flex-col">
              <span className="text-[11px] text-[#757682] uppercase font-semibold">DELTA-T</span>
              <span className="text-[20px] text-[#00236f] font-bold">
                4.8 <span className="text-[12px] font-normal">°C</span>
              </span>
            </div>
            <div className="bg-[#f2f3ff] rounded-lg p-2.5 shadow-sunken flex flex-col">
              <span className="text-[11px] text-[#757682] uppercase font-semibold">TEMP</span>
              <span className="text-[20px] text-[#00236f] font-bold">
                23.1 <span className="text-[12px] font-normal">°C</span>
              </span>
            </div>
          </div>

          {/* Economic Impact Module */}
          <div className="bg-[#e2e7ff] rounded-xl p-4 shadow-sunken flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#00236f] text-[13px] font-bold">
              <span className="material-symbols-outlined text-[18px]">monetization_on</span>
              <span>VALOR ECONÓMICO EN JUEGO</span>
            </div>
            <p className="text-[13px] text-[#131b2e] leading-relaxed">
              Aplicar en esta ventana vs. demorar o derivar:{' '}
              <span className="font-bold text-[#00236f]">Ahorro estimado de $3.450.000 ARS</span> en
              eficacia de caldo y control de deriva (185 ha).
            </p>
          </div>
        </div>
      </section>

      {/* 3. Línea de Tiempo de 72 Horas */}
      <section className="w-full pb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[12px] uppercase text-[#757682] tracking-wider font-semibold">
              PLANIFICACIÓN DINÁMICA
            </span>
            <h3 className="text-[18px] font-bold text-[#00236f]">LÍNEA DE TIEMPO 72 HORAS</h3>
          </div>
          <span className="text-[12px] text-[#757682]">Bloques de 3-6h</span>
        </div>

        {/* Franja 1: AHORA - 14:00 (Favorable) */}
        <div className="w-full rounded-xl bg-[#f2f3ff] p-4 shadow-extruded-sm flex items-center justify-between active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white shadow-extruded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0051d5] text-[24px]">air</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[#0051d5] font-bold text-[11px]">◆</span>
                <span className="text-[13px] font-bold text-[#00236f] uppercase">FAVORABLE</span>
                <span className="text-[12px] text-[#757682] ml-1">AHORA – 14:00</span>
              </div>
              <span className="text-[13px] text-[#444651] font-medium">
                12 km/h · Delta-T 4.8 · Temp 23°C
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#757682] text-[20px]">
            chevron_right
          </span>
        </div>

        {/* Franja 2: 15:00 - 18:00 (Al Límite) */}
        <div className="w-full rounded-xl bg-[#dae2fd] p-4 shadow-extruded-sm flex items-center justify-between active:scale-[0.99] transition-transform relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#00236f_25%,transparent_25%,transparent_50%,#00236f_50%,#00236f_75%,transparent_75%,transparent)] [background-size:12px_12px] pointer-events-none"></div>
          <div className="flex items-center gap-3 z-10">
            <div className="w-12 h-12 rounded-xl bg-[#eaedff] shadow-extruded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00236f] text-[24px]">cyclone</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[#00236f] font-bold text-[11px]">❚❚</span>
                <span className="text-[13px] font-bold text-[#00236f] uppercase">AL LÍMITE</span>
                <span className="text-[12px] text-[#757682] ml-1">15:00 – 18:00</span>
              </div>
              <span className="text-[13px] text-[#131b2e] font-medium">
                19 km/h (ráfagas 26 km/h) · Delta-T 6.5
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#757682] text-[20px] z-10">
            chevron_right
          </span>
        </div>

        {/* Franja 3: 19:00 - 02:00 (No Favorable) */}
        <div className="w-full rounded-xl bg-[#00236f] p-4 shadow-extruded-sm flex items-center justify-between text-white active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1e3a8a] shadow-sunken flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[24px]">foggy</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[#d4e3ff] text-[10px]">⯀</span>
                <span className="text-[13px] font-bold text-white uppercase tracking-wider">
                  NO FAVORABLE
                </span>
                <span className="text-[12px] text-[#b6c4ff] ml-1">19:00 – 02:00</span>
              </div>
              <span className="text-[13px] text-[#dae2fd] font-medium">
                Inversión térmica probable · Calma superficial
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#b6c4ff] text-[20px]">chevron_right</span>
        </div>

        {/* Franja 4: 03:00 - 09:00 (Favorable Óptimo) */}
        <div className="w-full rounded-xl bg-[#f2f3ff] p-4 shadow-extruded-sm flex items-center justify-between active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white shadow-extruded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0051d5] text-[24px]">dew_point</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[#0051d5] font-bold text-[11px]">◆</span>
                <span className="text-[13px] font-bold text-[#00236f] uppercase">
                  FAVORABLE (ÓPTIMO)
                </span>
                <span className="text-[12px] text-[#757682] ml-1">03:00 – 09:00</span>
              </div>
              <span className="text-[13px] text-[#444651] font-medium">
                Viento 8 km/h · Delta-T 3.5 · Rocío moderado
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#757682] text-[20px]">
            chevron_right
          </span>
        </div>
      </section>

      {/* 4. Sección Alerta de Helada a Nivel Cultivo */}
      <section className="w-full pb-6">
        <div className="bg-[#eaedff] rounded-xl p-5 shadow-extruded flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#e2e7ff] shadow-extruded-sm flex items-center justify-center flex-shrink-0 relative">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-white/80 rounded-full blur-[2px]"></div>
              <span className="material-symbols-outlined text-[#00236f] text-[28px]">ac_unit</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] uppercase text-[#757682] tracking-wider font-semibold">
                CANOPEO & RELIEVE
              </span>
              <h3 className="text-[18px] font-bold text-[#00236f] leading-snug">
                ESTIMACIÓN DE HELADA A NIVEL DE CULTIVO
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sunken flex flex-col gap-1">
            <span className="text-[11px] text-[#757682] uppercase font-semibold">
              TEMPERATURA MÍNIMA EN CANOPEO
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[38px] font-black text-[#00236f]">1.8</span>
              <span className="text-[20px] text-[#757682] font-bold">°C</span>
              <span className="text-[12px] text-[#444651] ml-auto font-medium">
                Madrugada 05:30 hs
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-[#00236f] text-[13px] font-bold">
              <span className="text-[12px]">❚❚</span>
              <span>Riesgo Moderado de Escarcha Localizada en Bajos</span>
            </div>
          </div>

          <div className="bg-[#dae2fd]/70 rounded-lg p-3">
            <p className="text-[12px] text-[#444651] leading-relaxed">
              <strong className="text-[#00236f] font-semibold">Nota técnica:</strong> Estimación
              microclimática calculada al abrir esta pantalla según relieve y balance radiativo. No es
              un aviso push y no reemplaza los partes oficiales del Servicio Meteorológico Nacional
              (SMN).
            </p>
          </div>
        </div>
      </section>

      {/* 5. Selector de Producto en Cascada (Receta Agronómica) */}
      <section className="w-full pb-6 flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-[12px] uppercase text-[#757682] tracking-wider font-semibold">
            RECETA AGRONÓMICA
          </span>
          <h3 className="text-[18px] font-bold text-[#00236f]">CONFIGURACIÓN DE CALDO</h3>
        </div>

        {/* Categoría: Pill Selectors */}
        <div className="grid grid-cols-3 gap-2 h-16">
          {(['HERBICIDAS', 'INSECTICIDAS', 'FUNGICIDAS'] as const).map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveIngredient(ingredientOptions[cat][0]);
                }}
                className={`h-full rounded-xl font-bold text-[13px] tracking-wide active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-[#00236f] text-white shadow-sunken'
                    : 'bg-[#eaedff] text-[#444651] shadow-extruded-sm hover:text-[#00236f]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Principio Activo Input / Dropdown Trigger (H: 64px) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="principio-activo" className="text-[12px] text-[#757682] uppercase font-semibold">
            Principio Activo
          </label>
          <div className="h-16 rounded-xl bg-[#e2e7ff] shadow-sunken flex items-center px-4 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-[#757682] text-[22px]">science</span>
              <select
                id="principio-activo"
                value={activeIngredient}
                onChange={(e) => setActiveIngredient(e.target.value)}
                className="bg-transparent text-[14px] text-[#131b2e] font-semibold truncate focus:outline-none cursor-pointer w-full"
              >
                {ingredientOptions[selectedCategory].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <span className="material-symbols-outlined text-[#00236f] text-[24px]">
              arrow_drop_down
            </span>
          </div>
        </div>

        {/* Nombre Comercial Input / Dropdown Trigger (H: 64px) */}
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[#757682] uppercase font-semibold">
            Nombre Comercial & Adyuvante
          </label>
          <div className="h-16 rounded-xl bg-[#e2e7ff] shadow-sunken flex items-center px-4 justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="material-symbols-outlined text-[#757682] text-[22px]">
                format_paint
              </span>
              <input
                type="text"
                value={commercialName}
                onChange={(e) => setCommercialName(e.target.value)}
                className="bg-transparent text-[14px] text-[#131b2e] font-semibold truncate focus:outline-none w-full"
              />
            </div>
            <span className="material-symbols-outlined text-[#00236f] text-[24px]">tune</span>
          </div>
        </div>

        {/* Restricción de Gotas Telemetry Card */}
        <div className="rounded-xl bg-[#dae2fd] p-4 shadow-extruded-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white shadow-extruded-sm flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#0051d5] text-[22px]">water_drop</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#00236f] uppercase">
              Restricción de Gotas
            </span>
            <span className="text-[12px] text-[#131b2e] font-medium">
              Requiere tamaño de gota gruesa (350-450 µm) por régimen eólico actual.
            </span>
          </div>
        </div>
      </section>

      {/* 6. Botón Enorme Primario (Alto 68px, Navy Saturado, Bold 20px) */}
      <section className="w-full pt-1 pb-6">
        <button
          type="button"
          id="btnRegistrar"
          disabled={isRegistering || registeredSuccess}
          onClick={handleRegister}
          className="w-full h-[68px] rounded-xl bg-[#00236f] text-white text-[17px] sm:text-[19px] font-bold uppercase tracking-wider shadow-extruded flex items-center justify-center gap-2 active:shadow-sunken active:bg-[#283044] transition-all cursor-pointer"
        >
          {isRegistering ? (
            <>
              <span className="material-symbols-outlined text-[26px] animate-spin">sync</span>
              <span>VALIDANDO SENSORES...</span>
            </>
          ) : registeredSuccess ? (
            <>
              <span className="material-symbols-outlined text-[26px]">check_circle</span>
              <span>ORDEN CONFIRMADA</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[26px]">task_alt</span>
              <span>REGISTRAR APLICACIÓN EN ESTE LOTE</span>
            </>
          )}
        </button>
      </section>

      {/* 7. Aviso Legal Perenne al Pie */}
      <footer className="w-full bg-[#f2f3ff] rounded-xl p-4 shadow-sunken flex flex-col gap-1.5">
        <span className="text-[12px] text-[#757682] font-bold tracking-wider">
          [RESOLUCIÓN Y NORMATIVAS PROVINCIALES VIGENTES]
        </span>
        <p className="text-[12px] text-[#444651] leading-relaxed">
          Responsabilidad técnica sujeta a validación a campo por profesional agrónomo matriculado.
          La decisión de pulverización final y verificación de distancias de amortiguamiento a zonas
          pobladas y cursos hídricos es exclusiva del aplicador matriculado.
        </p>
      </footer>
    </div>
  );
}
