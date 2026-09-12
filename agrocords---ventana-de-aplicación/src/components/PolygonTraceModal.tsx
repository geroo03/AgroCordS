import { useState, MouseEvent } from 'react';
import { Lot } from '../types';

interface PolygonTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLot: (newLot: Lot) => void;
}

export default function PolygonTraceModal({ isOpen, onClose, onSaveLot }: PolygonTraceModalProps) {
  const [lotName, setLotName] = useState('Lote 5 - El Molino');
  const [crop, setCrop] = useState('Soja 1ra');
  const [hectares, setHectares] = useState('142');
  const [activePoints, setActivePoints] = useState<Array<{ x: number; y: number }>>([
    { x: 30, y: 35 },
    { x: 80, y: 30 },
    { x: 85, y: 75 },
    { x: 25, y: 70 }
  ]);
  const [isAddingPoint, setIsAddingPoint] = useState(false);

  if (!isOpen) return null;

  const handleSvgClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!isAddingPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setActivePoints([...activePoints, { x, y }]);
    setIsAddingPoint(false);
  };

  const handleSave = () => {
    const newLot: Lot = {
      id: `lote-${Date.now()}`,
      name: lotName,
      hectares: Number(hectares) || 100,
      crop: crop,
      stage: 'V4',
      station: 'ESTACIÓN PERGAMINO OESTE',
      stationTime: 'hace 2 min',
      condition: 'FAVORABLE',
      conditionTitle: 'CONDICIONES FAVORABLES',
      conditionDesc: 'Viento 9 km/h · Delta-T 3.9 · Humedad 62%',
      windSpeed: 9,
      windDirection: 'SO',
      deltaT: 3.9,
      temp: 22.4,
      humidity: 62,
      points: activePoints,
      economicImpact: 'Ahorro estimado de $2.100.000 ARS en control de deriva.'
    };
    onSaveLot(newLot);
    onClose();
  };

  const pointsString = activePoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[400px] bg-[#faf8ff] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#eaedff] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] text-[22px]">polyline</span>
            <h3 className="font-bold text-[#00236f] text-[16px]">Trazador de Polígono Catastral</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white shadow-extruded-sm flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Interactive Simulated Satellite Canvas */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>CANVAS SATELITAL TÁCTIL (10m)</span>
              <span>{activePoints.length} vértices georreferenciados</span>
            </div>
            <div className="w-full h-56 bg-slate-900 rounded-xl relative overflow-hidden shadow-sunken border border-slate-300">
              {/* Grid texture */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              ></div>

              {/* Satellite fields mockup visual */}
              <div className="absolute top-2 left-2 w-32 h-24 bg-emerald-950/60 rounded border border-emerald-500/20"></div>
              <div className="absolute bottom-4 right-4 w-36 h-28 bg-amber-950/50 rounded border border-amber-500/20"></div>

              {/* SVG interactive polygon */}
              <svg
                onClick={handleSvgClick}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points={pointsString}
                  fill="#316bf3"
                  fillOpacity="0.45"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                />
                {activePoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.2"
                    fill="#00236f"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400">
                Lat: -33.891 · Lon: -60.573
              </div>

              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setIsAddingPoint(true)}
                  className={`px-2 py-1 rounded text-[11px] font-bold shadow ${
                    isAddingPoint ? 'bg-amber-400 text-black' : 'bg-white/90 text-[#00236f]'
                  }`}
                >
                  {isAddingPoint ? 'Toca el mapa...' : '+ Añadir Vértice'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Toque en el mapa satelital para ajustar el perímetro del lote sin superposición.
            </p>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#00236f] uppercase block mb-1">
                Nombre del Lote
              </label>
              <input
                type="text"
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
                className="w-full h-12 px-3 rounded-xl bg-[#f2f3ff] shadow-sunken text-sm font-bold text-[#131b2e] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-[#00236f] uppercase block mb-1">
                  Cultivo
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full h-12 px-2 rounded-xl bg-[#f2f3ff] shadow-sunken text-sm font-bold text-[#131b2e] focus:outline-none"
                >
                  <option value="Soja 1ra">Soja 1ra</option>
                  <option value="Maíz Tardío">Maíz Tardío</option>
                  <option value="Girasol">Girasol</option>
                  <option value="Trigo">Trigo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#00236f] uppercase block mb-1">
                  Superficie (ha)
                </label>
                <input
                  type="number"
                  value={hectares}
                  onChange={(e) => setHectares(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl bg-[#f2f3ff] shadow-sunken text-sm font-bold text-[#131b2e] focus:outline-none"
                />
              </div>
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
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-xl bg-[#00236f] text-white shadow-extruded font-bold text-xs uppercase"
          >
            Confirmar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
