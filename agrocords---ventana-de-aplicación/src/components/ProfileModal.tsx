import { useState } from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onLogout: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  userEmail,
  onLogout
}: ProfileModalProps) {
  const [operatorName, setOperatorName] = useState('Ing. Agr. Juan Manuel Rossi');
  const [registrationNumber, setRegistrationNumber] = useState('CIAFBA #7481');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[390px] bg-[#faf8ff] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#eaedff] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[22px]">
              badge
            </span>
            <h3 className="font-bold text-[#00236f] text-[15px]">Perfil de Operador / Asesor</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white shadow-extruded-sm flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#00236f] flex items-center justify-center text-white shadow-extruded-sm">
              <span className="material-symbols-outlined text-[28px]">person</span>
            </div>
            <div>
              <h4 className="font-bold text-[#131b2e] text-sm">{operatorName}</h4>
              <p className="text-xs text-[#0051d5] font-semibold">{registrationNumber}</p>
              <p className="text-[11px] text-slate-400 truncate max-w-[190px]">{userEmail}</p>
            </div>
          </div>

          <div className="bg-[#f2f3ff] p-3 rounded-xl shadow-sunken space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Establecimiento:</span>
              <span className="font-bold text-[#00236f]">La Posta (Pergamino)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Estado de Licencia:</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                ACTIVA · AGRO PRO
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Nodo Sincronizado:</span>
              <span className="font-mono text-slate-700 text-[11px]">base:0x4f8a...c93b</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#00236f] uppercase block">
              Editar Nombre del Responsable
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#f2f3ff] shadow-sunken text-xs font-bold text-[#131b2e] focus:outline-none"
            />

            <label className="text-xs font-bold text-[#00236f] uppercase block">
              Matrícula Profesional
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#f2f3ff] shadow-sunken text-xs font-bold text-[#131b2e] focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#eaedff] border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 h-12 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold text-xs uppercase hover:bg-red-100"
          >
            Cerrar Sesión
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-[#00236f] text-white shadow-extruded font-bold text-xs uppercase"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
