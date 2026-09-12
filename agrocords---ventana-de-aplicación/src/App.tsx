/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ScreenView, Lot, FontSizeScale } from './types';
import { DEFAULT_LOTS } from './data/mockData';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AuthScreen from './components/AuthScreen';
import LotesScreen from './components/LotesScreen';
import VentanasScreen from './components/VentanasScreen';
import HistorialScreen from './components/HistorialScreen';
import DetalleLoteScreen from './components/DetalleLoteScreen';
import PolygonTraceModal from './components/PolygonTraceModal';
import NozzleAdjustmentModal from './components/NozzleAdjustmentModal';
import ProfileModal from './components/ProfileModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ScreenView>('lotes');
  const [lots, setLots] = useState<Lot[]>(DEFAULT_LOTS);
  const [selectedLot, setSelectedLot] = useState<Lot>(DEFAULT_LOTS[0]);
  const [userEmail, setUserEmail] = useState<string>('productor@establecimiento.com.ar');
  const [fontSizeScale, setFontSizeScale] = useState<FontSizeScale>('mediano');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  // Modals state
  const [isPolygonModalOpen, setIsPolygonModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNozzleModalOpen, setIsNozzleModalOpen] = useState(false);
  const [activeNozzleLot, setActiveNozzleLot] = useState<Lot | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSelectLotDetail = (lot: Lot) => {
    setSelectedLot(lot);
    setCurrentView('detalle');
  };

  const handleAdjustNozzles = (lot: Lot) => {
    setActiveNozzleLot(lot);
    setIsNozzleModalOpen(true);
  };

  const handleViewLog = (lot: Lot) => {
    setSelectedLot(lot);
    setCurrentView('ventanas');
    showToast(`Bitácora y telemetría cargada para ${lot.name}`);
  };

  const handleSaveNewLot = (newLot: Lot) => {
    setLots([newLot, ...lots]);
    setSelectedLot(newLot);
    showToast(`Lote "${newLot.name}" trazado y registrado con éxito`);
  };

  const handleLoadExamples = () => {
    setLots(DEFAULT_LOTS);
    showToast('3 lotes de ejemplo restablecidos con telemetría de Pergamino');
  };

  const handleRegisterApplicationSuccess = (lotName: string) => {
    showToast(`Aplicación registrada en ${lotName}. Acta oficial generada.`);
    setCurrentView('ventanas');
  };

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setCurrentView('lotes');
    showToast(`Sesión activa: ${email}`);
  };

  const handleLogout = () => {
    setIsProfileModalOpen(false);
    setCurrentView('auth');
    showToast('Sesión cerrada. Mostrando pantalla de autenticación.');
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-start transition-colors duration-200 ${
        highContrast ? 'bg-slate-900 text-slate-100 high-contrast-mode' : 'bg-[#e9eff6]'
      }`}
    >
      {/* Quick Screen Switcher Bar (Useful in development & for easy demo of all screens) */}
      <aside aria-label="Navegación de pantallas" className="w-full max-w-[430px] bg-[#00236f] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-bold z-50 shadow-md">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          PANTALLAS:
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentView('auth')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              currentView === 'auth' ? 'bg-white text-[#00236f]' : 'bg-blue-900/60 hover:bg-blue-800'
            }`}
          >
            1. Login
          </button>
          <button
            onClick={() => setCurrentView('lotes')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              currentView === 'lotes' ? 'bg-white text-[#00236f]' : 'bg-blue-900/60 hover:bg-blue-800'
            }`}
          >
            2. Lotes
          </button>
          <button
            onClick={() => setCurrentView('detalle')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              currentView === 'detalle' ? 'bg-white text-[#00236f]' : 'bg-blue-900/60 hover:bg-blue-800'
            }`}
          >
            3. Detalle
          </button>
          <button
            onClick={() => setCurrentView('ventanas')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              currentView === 'ventanas' ? 'bg-white text-[#00236f]' : 'bg-blue-900/60 hover:bg-blue-800'
            }`}
          >
            4. Ventanas
          </button>
          <button
            onClick={() => setCurrentView('historial')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              currentView === 'historial' ? 'bg-white text-[#00236f]' : 'bg-blue-900/60 hover:bg-blue-800'
            }`}
          >
            5. Historial
          </button>
        </div>
      </aside>

      {/* Main Mobile Screen Container */}
      <div
        className={`w-full max-w-[430px] min-h-[calc(100vh-32px)] flex flex-col relative shadow-2xl transition-all ${
          highContrast ? 'bg-[#0f172a]' : 'bg-[#faf8ff]'
        }`}
      >
        {/* Persistent Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-12 z-50 max-w-[380px] mx-auto inset-x-4 bg-[#00236f] text-white p-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 border border-blue-400/40 animate-slideDown">
            <span className="material-symbols-outlined text-[20px] text-emerald-400 shrink-0">
              check_circle
            </span>
            <p className="text-xs font-semibold leading-snug flex-1">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/70 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Global Screen Header */}
        <Header
          currentView={currentView}
          selectedLot={selectedLot}
          lots={lots}
          onSelectLot={setSelectedLot}
          onBack={() => setCurrentView('lotes')}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onSelectView={setCurrentView}
        />

        {/* Animated View Container */}
        <main className="flex-1 w-full relative flex flex-col">
          <AnimatePresence mode="wait">
            {currentView === 'auth' && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full flex-1"
              >
                <AuthScreen
                  onContinueLocal={() => {
                    setCurrentView('lotes');
                    showToast('Ingresaste en modo local sin cuenta.');
                  }}
                  onLoginSuccess={handleLoginSuccess}
                />
              </motion.div>
            )}

            {currentView === 'lotes' && (
              <motion.div
                key="lotes"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <LotesScreen
                  lots={lots}
                  onSelectLotDetail={handleSelectLotDetail}
                  onOpenNewLot={() => setIsPolygonModalOpen(true)}
                  onLoadExamples={handleLoadExamples}
                  fontSizeScale={fontSizeScale}
                  onChangeFontSize={setFontSizeScale}
                  onAdjustNozzles={handleAdjustNozzles}
                  onViewLog={handleViewLog}
                />
              </motion.div>
            )}

            {currentView === 'detalle' && (
              <motion.div
                key="detalle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <DetalleLoteScreen
                  lot={selectedLot}
                  onBack={() => setCurrentView('lotes')}
                  onRegisterSuccess={handleRegisterApplicationSuccess}
                />
              </motion.div>
            )}

            {currentView === 'ventanas' && (
              <motion.div
                key="ventanas"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <VentanasScreen
                  onOpenRegister={() => {
                    setCurrentView('detalle');
                    showToast('Seleccioná el producto en el Lote 3 para registrar la aplicación.');
                  }}
                />
              </motion.div>
            )}

            {currentView === 'historial' && (
              <motion.div
                key="historial"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <HistorialScreen
                  fontSizeScale={fontSizeScale}
                  onChangeFontSize={setFontSizeScale}
                  highContrast={highContrast}
                  onToggleHighContrast={() => {
                    const next = !highContrast;
                    setHighContrast(next);
                    showToast(
                      next ? 'Modo Alto Contraste (Pleno Sol) activado' : 'Modo estándar activado'
                    );
                  }}
                  soundAlerts={soundAlerts}
                  onToggleSoundAlerts={() => {
                    const next = !soundAlerts;
                    setSoundAlerts(next);
                    showToast(
                      next ? 'Alertas sonoras habilitadas' : 'Alertas sonoras silenciadas'
                    );
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Persistent Bottom Nav (always visible except on auth) */}
        <BottomNav currentView={currentView} onSelectView={setCurrentView} />
      </div>

      {/* Modals */}
      <PolygonTraceModal
        isOpen={isPolygonModalOpen}
        onClose={() => setIsPolygonModalOpen(false)}
        onSaveLot={handleSaveNewLot}
      />

      <NozzleAdjustmentModal
        lot={activeNozzleLot}
        isOpen={isNozzleModalOpen}
        onClose={() => setIsNozzleModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
    </div>
  );
}
