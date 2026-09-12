import { useState, FormEvent } from 'react';
import Logo from './Logo';

interface AuthScreenProps {
  onContinueLocal: () => void;
  onLoginSuccess: (email: string) => void;
}

export default function AuthScreen({ onContinueLocal, onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'sent'>('form');
  const [email, setEmail] = useState('productor@establecimiento.com.ar');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    'No pudimos conectar con el servidor de correos. Verificá que la dirección no tenga espacios y reintentá.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSendLink = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setShowError(true);
      setErrorMessage('Ingresá una casilla válida con formato nombre@dominio.com.');
      return;
    }

    setShowError(false);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setActiveTab('sent');
    }, 650);
  };

  const handleResend = () => {
    setResendStatus('sending');
    setTimeout(() => {
      setResendStatus('sent');
      setTimeout(() => {
        setResendStatus('idle');
      }, 2500);
    }, 600);
  };

  const toggleErrorDemo = () => {
    setShowError(!showError);
    if (!showError) {
      setErrorMessage(
        'Error de conexión o timeout con el servicio Supabase. Verificá la señal del lote y reintentá.'
      );
    }
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-screen bg-[#f3f6fb] relative shadow-2xl overflow-x-hidden">
      {/* Top System Bar / Offline Notice */}
      <header className="pt-4 px-6 pb-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
            Nodo AgroCordS · Conexión Segura
          </span>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
          v2.4
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-6 py-4">
        {/* LOGO CENTRADO CON ESPACIO GENEROSO */}
        <div className="flex flex-col items-center justify-center text-center mt-2 mb-6">
          <div className="relative w-36 h-36 flex items-center justify-center p-2 rounded-3xl neo-card">
            <Logo size={128} />
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-black tracking-tight text-[#0a152e]">AgroCordS</h1>
            <p className="text-xs font-bold tracking-[0.25em] text-blue-800 uppercase mt-0.5">
              Ventana de Aplicación
            </p>
          </div>

          {/* Value Proposition / Reason to Register (One Line Prominent) */}
          <div className="mt-4 px-4 py-2.5 rounded-xl neo-input-sunken max-w-[340px]">
            <p className="text-xs font-semibold text-slate-700 leading-snug">
              🌾 <strong className="text-[#0a152e]">Guardá tus lotes</strong> y accedé desde cualquier dispositivo.
            </p>
          </div>
        </div>

        {/* INTERACTIVE TAB: Switch between Form & Sent State */}
        <div className="mb-4 flex items-center justify-center">
          <div className="p-1 rounded-full neo-toggle-pill flex items-center gap-1 w-full max-w-[300px]">
            <button
              id="tabFormBtn"
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-1.5 text-xs rounded-full transition-all duration-200 ${
                activeTab === 'form'
                  ? 'neo-toggle-active font-bold text-[#0a152e]'
                  : 'font-semibold text-slate-500 hover:text-[#0a152e]'
              }`}
            >
              1. Solicitar Acceso
            </button>
            <button
              id="tabSentBtn"
              type="button"
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-1.5 text-xs rounded-full transition-all duration-200 ${
                activeTab === 'sent'
                  ? 'neo-toggle-active font-bold text-[#0a152e]'
                  : 'font-semibold text-slate-500 hover:text-[#0a152e]'
              }`}
            >
              2. Correo Enviado
            </button>
          </div>
        </div>

        {/* STATE 1: EMAIL INPUT & MAGIC LINK */}
        {activeTab === 'form' && (
          <div className="w-full transition-opacity duration-200">
            <form onSubmit={handleSendLink} className="space-y-4">
              {/* Big Email Input with Permanent Visible Label */}
              <div className="space-y-2">
                <label
                  htmlFor="producerEmail"
                  className="block text-sm font-bold text-[#0a152e] tracking-wide"
                >
                  CORREO ELECTRÓNICO
                </label>
                <div className="neo-input-sunken rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-colors">
                  <svg
                    className="w-6 h-6 text-slate-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                  </svg>
                  <input
                    type="email"
                    id="producerEmail"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="productor@establecimiento.com.ar"
                    className="w-full bg-transparent text-base font-semibold text-[#0a152e] placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-500 px-1">
                  Te enviaremos un link directo a tu bandeja. Sin contraseñas que recordar en cabina.
                </p>
              </div>

              {/* Inline Error Banner */}
              {showError && (
                <div className="p-3.5 rounded-2xl bg-blue-950 text-white border-2 border-blue-600 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-blue-800 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      !
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-white uppercase tracking-wider">
                        Error de envío del link
                      </p>
                      <p className="text-blue-200 mt-0.5">{errorMessage}</p>
                      <button
                        type="button"
                        onClick={() => setShowError(false)}
                        className="mt-2 text-xs font-bold underline text-sky-300 hover:text-white uppercase tracking-wide cursor-pointer"
                      >
                        Reintentar envío ahora
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Button: Enorme (Min height 64px) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 rounded-2xl neo-btn-primary flex items-center justify-center gap-3 text-white text-lg font-bold tracking-wide cursor-pointer focus:outline-none"
              >
                {isLoading ? (
                  <span>Generando enlace mágico...</span>
                ) : (
                  <>
                    <span>Enviarme el link de acceso</span>
                    <svg
                      className="w-5 h-5 text-blue-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      ></path>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Secondary Option: Seguir sin cuenta (Chica, discreta y visible) */}
            <div className="mt-5 text-center space-y-3">
              <button
                type="button"
                onClick={onContinueLocal}
                className="text-sm font-bold text-slate-600 hover:text-[#0a152e] transition-colors py-2 px-4 rounded-xl border border-transparent hover:border-slate-300 cursor-pointer"
              >
                ← Seguir sin cuenta (modo local en este teléfono)
              </button>

              <div>
                <button
                  type="button"
                  onClick={toggleErrorDemo}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Simular estado de error / reintento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: CONFIRMATION "REVISÁ TU CORREO" WITH CLAYMORPHISM ENVELOPE */}
        {activeTab === 'sent' && (
          <div className="w-full transition-opacity duration-200">
            <div className="neo-card rounded-3xl p-6 text-center flex flex-col items-center">
              {/* CLAYMORPHISM 3D ENVELOPE */}
              <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                <div className="w-20 h-20 rounded-3xl clay-card flex items-center justify-center transform rotate-2">
                  <svg
                    className="w-11 h-11 text-[#0f254e] drop-shadow"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="8" y="14" width="48" height="36" rx="8" fill="#1e3a8a" />
                    <rect x="9" y="15" width="46" height="34" rx="7" fill="url(#clayEnvGrad)" />
                    <path
                      d="M10 18L32 35L54 18"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="48" cy="14" r="5" fill="#38bdf8" />
                    <path
                      d="M48 10V18M44 14H52"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="clayEnvGrad"
                        x1="12"
                        y1="14"
                        x2="52"
                        y2="50"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#2563eb" />
                        <stop offset="1" stopColor="#0f254e" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="absolute top-2 left-4 w-4 h-4 rounded-full bg-white opacity-60 filter blur-[1px]"></div>
              </div>

              <h2 className="text-2xl font-black text-[#0a152e] mb-1">¡Revisá tu correo!</h2>
              <p className="text-xs text-slate-600 font-medium px-2 leading-relaxed">
                Te enviamos el enlace mágico a:
              </p>
              <div className="my-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-sm font-bold text-[#0f254e] break-all">
                  {email || 'productor@establecimiento.com.ar'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Abrí el correo desde este teléfono y tocá el botón para ingresar al instante sin
                contraseña.
              </p>

              {/* Direct access button for instant testing */}
              <button
                type="button"
                onClick={() => onLoginSuccess(email)}
                className="w-full h-16 rounded-2xl neo-btn-primary flex items-center justify-center gap-2 text-white text-base font-bold tracking-wide cursor-pointer mb-3"
              >
                <span>Acceder a la cabina</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>

              {/* Reenviar Button (Secondary Neomorphic Extruded Button >= 64px) */}
              <button
                type="button"
                onClick={handleResend}
                className="w-full h-14 rounded-2xl neo-btn-secondary flex items-center justify-center gap-2 text-[#0f254e] text-sm font-bold tracking-wide cursor-pointer hover:bg-slate-50"
              >
                <svg
                  className="w-5 h-5 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                <span>
                  {resendStatus === 'sending'
                    ? 'Enviando nuevo enlace...'
                    : resendStatus === 'sent'
                    ? '¡Enlace reenviado con éxito!'
                    : 'Reenviar enlace de acceso'}
                </span>
              </button>

              {/* Back to change email */}
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="mt-4 text-xs font-bold text-slate-500 hover:text-[#0a152e] underline cursor-pointer"
              >
                Usar otro correo electrónico
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Legal Notice */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-[#eaf0f8]">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            ></path>
          </svg>
          <p className="text-[11px] leading-tight text-slate-600 font-medium">
            <strong className="text-slate-800">AVISO LEGAL:</strong> Esta aplicación describe
            condiciones meteorológicas y no reemplaza la receta fitosanitaria emitida por un
            profesional agrónomo matriculado.
          </p>
        </div>
      </footer>
    </div>
  );
}
