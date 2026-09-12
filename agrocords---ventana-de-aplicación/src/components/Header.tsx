import { ScreenView, Lot } from '../types';

interface HeaderProps {
  currentView: ScreenView;
  selectedLot: Lot;
  lots: Lot[];
  onSelectLot: (lot: Lot) => void;
  onBack?: () => void;
  onOpenProfile: () => void;
  onSelectView: (view: ScreenView) => void;
}

export default function Header({
  currentView,
  selectedLot,
  lots,
  onSelectLot,
  onBack,
  onOpenProfile,
  onSelectView
}: HeaderProps) {
  if (currentView === 'auth') {
    return (
      <header className="pt-4 px-6 pb-2 flex items-center justify-between z-10 w-full">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1e3a8a] animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
            Nodo AgroCordS · Conexión Segura
          </span>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
          v2.4
        </span>
      </header>
    );
  }

  if (currentView === 'detalle') {
    return (
      <header className="sticky top-0 inset-x-0 z-40 bg-[#eef2f7]/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(160,175,200,0.18)] pt-2 pb-2">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-11 h-11 rounded-xl bg-[#eaedff] shadow-extruded-sm flex items-center justify-center text-[#00236f] active:scale-95 transition-transform"
              title="Volver"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <span className="text-[12px] uppercase text-[#757682] tracking-wider font-semibold">
                DETALLE OPERATIVO
              </span>
              <h1 className="text-[20px] font-bold text-[#131b2e] tracking-tight leading-none">
                Detalle De Lote
              </h1>
            </div>
          </div>
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full bg-[#00236f] flex items-center justify-center shadow-extruded-sm text-white active:scale-95 transition-transform"
            title="Perfil de Operador"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>
        </div>
      </header>
    );
  }

  // Standard Header for Lotes, Ventanas, Historial
  const viewTitle =
    currentView === 'lotes'
      ? 'Lotes'
      : currentView === 'ventanas'
      ? 'Ventanas'
      : 'Historial';

  return (
    <header className="sticky top-0 inset-x-0 z-40 bg-[#eef2f7]/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(160,175,200,0.18)] pt-2 pb-2">
      <div className="px-4 flex flex-col justify-center gap-1">
        {/* Top telemetry line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00236f] animate-pulse"></span>
            <span className="text-[13px] font-bold tracking-wider text-[#00236f] uppercase">
              VENTANA DE APLICACIÓN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#757682]">sync</span>
            <span className="text-[12px] text-[#444651] font-medium">Sinc: 10:14 hs</span>
            <button
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-full bg-[#00236f] flex items-center justify-center ml-1 shadow-extruded-sm text-white active:scale-95 transition-transform"
              title="Perfil & Cuenta"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          </div>
        </div>

        {/* Location selector dropdown & Screen title */}
        <div className="flex items-center justify-between mt-1">
          <div className="relative group">
            <label htmlFor="lot-select" className="sr-only">Seleccionar Lote</label>
            <div className="flex items-center gap-1.5 bg-[#eaedff] px-3 py-1.5 rounded-lg shadow-extruded-sm text-[14px] text-[#131b2e] font-semibold cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-[#00236f]">location_on</span>
              <select
                id="lot-select"
                value={selectedLot.id}
                onChange={(e) => {
                  const target = lots.find((l) => l.id === e.target.value);
                  if (target) onSelectLot(target);
                }}
                className="bg-transparent text-[13px] sm:text-[14px] font-semibold text-[#131b2e] focus:outline-none cursor-pointer pr-1"
              >
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} (Pergamino)
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[16px] text-[#757682]">expand_more</span>
            </div>
          </div>

          <h2 className="text-[20px] font-bold text-[#00236f] tracking-tight">
            {viewTitle}
          </h2>
        </div>
      </div>
    </header>
  );
}
