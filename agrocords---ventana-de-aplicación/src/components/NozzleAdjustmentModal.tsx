import { useState } from 'react';
import { Lot } from '../types';

interface NozzleAdjustmentModalProps {
  lot: Lot | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NozzleAdjustmentModal({ lot, isOpen, onClose }: NozzleAdjustmentModalProps) {
  const [pressure, setPressure] = useState(3.2);
  const [nozzleType, setNozzleType] = useState('Antideriva con inducción de aire (AIXR)');
  const [boomHeight, setBoomHeight] = useState(50);
  const [saved, setSaved] = useState(false);

  if (!isOpen || !lot) return null;

  const handleApply = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[390px] bg-[#faf8ff] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#eaedff] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[22px]">tune</span>
            <div>
              <h3 className="font-bold text-[#00236f] text-[15px]">Ajuste Táctico de Picos</h3>
              <p className="text-[11px] text-[#757682]">{lot.name}</p>
            </div>
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
          <div className="bg-[#dae2fd] p-3 rounded-xl shadow-sunken flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00236f] text-[24px]">speed</span>
            <div>
              <p className="text-xs font-bold text-[#00236f]">RÁFAGAS DETECTADAS: 24 km/h</p>
              <p className="text-[11px] text-[#444651]">
                Ajustá la presión y pastilla para mitigar deriva exógena.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#00236f] uppercase block mb-1">
                Tipo de Boquilla / Pastilla
              </label>
              <select
                value={nozzleType}
                onChange={(e) => setNozzleType(e.target.value)}
                className="w-full h-12 px-3 rounded-xl bg-[#f2f3ff] shadow-sunken text-xs font-bold text-[#131b2e] focus:outline-none"
              >
                <option value="Antideriva con inducción de aire (AIXR)">
                  AIXR - Inducción de Aire (Gotas Muy Gruesas)
                </option>
                <option value="Doble Abanico Plano (TTJ60)">
                  TTJ60 - Doble Abanico (Gotas Medianas)
                </option>
                <option value="Cono Hueco Cerámico">Cono Hueco Cerámico (Fungicidas)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#00236f] uppercase mb-1">
                <span>Presión de Trabajo</span>
                <span>{pressure.toFixed(1)} bar</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.1"
                value={pressure}
                onChange={(e) => setPressure(parseFloat(e.target.value))}
                className="w-full accent-[#00236f] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1.5 bar (Gota mayor)</span>
                <span>5.0 bar (Riesgo deriva)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#00236f] uppercase mb-1">
                <span>Altura de Botalón sobre Canopeo</span>
                <span>{boomHeight} cm</span>
              </div>
              <input
                type="range"
                min="35"
                max="75"
                step="5"
                value={boomHeight}
                onChange={(e) => setBoomHeight(parseInt(e.target.value))}
                className="w-full accent-[#00236f] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#eaedff] border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-white shadow-extruded text-[#00236f] font-bold text-xs uppercase"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-12 rounded-xl bg-[#00236f] text-white shadow-extruded font-bold text-xs uppercase"
          >
            {saved ? '✓ Ajuste Calibrado' : 'Guardar Calibración'}
          </button>
        </div>
      </div>
    </div>
  );
}
