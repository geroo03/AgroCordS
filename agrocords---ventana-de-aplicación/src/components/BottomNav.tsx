import { ScreenView } from '../types';

interface BottomNavProps {
  currentView: ScreenView;
  onSelectView: (view: ScreenView) => void;
}

export default function BottomNav({ currentView, onSelectView }: BottomNavProps) {
  if (currentView === 'auth') {
    return null;
  }

  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 bg-[#faf8ff]/95 backdrop-blur-xl pt-2 pb-3 shadow-[0_-4px_16px_rgba(160,175,200,0.22)] border-t border-slate-200/60 max-w-[430px] mx-auto">
      {/* Permanent Legal Notice Bar directly above tabs */}
      <div className="px-4 mb-2">
        <div className="bg-[#f2f3ff] px-3 py-1.5 rounded-lg shadow-sunken flex items-start gap-2">
          <span className="material-symbols-outlined text-[#757682] text-[16px] shrink-0 mt-0.5">
            gavel
          </span>
          <p className="text-[12px] leading-tight text-[#444651]">
            <strong className="font-semibold text-[#131b2e]">AVISO LEGAL:</strong> Condiciones
            estimadas. No reemplaza receta agronómica oficial.
          </p>
        </div>
      </div>

      {/* 3 Main Tabs */}
      <nav className="px-4">
        <div className="flex justify-between items-center gap-3">
          {/* Lotes Tab */}
          <button
            onClick={() => onSelectView('lotes')}
            type="button"
            className={`flex-1 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.98] ${
              currentView === 'lotes'
                ? 'bg-[#dae2fd] shadow-sunken text-[#00236f] font-bold'
                : 'bg-[#eaedff] shadow-extruded text-[#444651] hover:text-[#00236f]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">grid_view</span>
            <span className="text-[13px] uppercase tracking-wider font-semibold">Lotes</span>
          </button>

          {/* Ventanas Tab */}
          <button
            onClick={() => onSelectView('ventanas')}
            type="button"
            className={`flex-1 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.98] ${
              currentView === 'ventanas'
                ? 'bg-[#dae2fd] shadow-sunken text-[#00236f] font-bold'
                : 'bg-[#eaedff] shadow-extruded text-[#444651] hover:text-[#00236f]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">water_drop</span>
            <span className="text-[13px] uppercase tracking-wider font-semibold">Ventanas</span>
          </button>

          {/* Historial Tab */}
          <button
            onClick={() => onSelectView('historial')}
            type="button"
            className={`flex-1 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.98] ${
              currentView === 'historial'
                ? 'bg-[#dae2fd] shadow-sunken text-[#00236f] font-bold'
                : 'bg-[#eaedff] shadow-extruded text-[#444651] hover:text-[#00236f]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">history</span>
            <span className="text-[13px] uppercase tracking-wider font-semibold">Historial</span>
          </button>
        </div>
      </nav>
    </footer>
  );
}
