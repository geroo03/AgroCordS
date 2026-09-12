"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { iniciarSesion } from "@/lib/sesion";

type Paso = "formulario" | "enviado";

const REGEX_EMAIL = /^\S+@\S+\.\S+$/;

/**
 * Login por magic link (sin contraseña). Todavía no hay backend de
 * autenticación: los envíos y el ingreso están simulados con timeouts y
 * quedan marcados con TODO(backend) donde hay que enchufar la API real.
 * Mientras tanto, "Seguir sin cuenta" lleva al modo local actual (localStorage
 * en este dispositivo), que es como funciona hoy toda la app.
 */
export default function PaginaLogin() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("formulario");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  const enviarEnlace = (e: FormEvent) => {
    e.preventDefault();
    if (!REGEX_EMAIL.test(email)) {
      setError("Ingresá una casilla válida con formato nombre@dominio.com.");
      return;
    }
    setError(null);
    setEnviando(true);

    // TODO(backend): reemplazar por la llamada real que dispara el magic
    // link (ej.: POST /api/auth/magic-link con { email }).
    setTimeout(() => {
      setEnviando(false);
      setPaso("enviado");
    }, 650);
  };

  const reenviar = () => {
    setReenviando(true);
    setReenviado(false);
    // TODO(backend): reemplazar por la llamada real de reenvío del enlace.
    setTimeout(() => {
      setReenviando(false);
      setReenviado(true);
      setTimeout(() => setReenviado(false), 2500);
    }, 700);
  };

  const continuarSinCuenta = () => {
    router.push("/lotes");
  };

  const ingresar = () => {
    // TODO(backend): acá se valida el token del magic link / se crea la
    // sesión real antes de entrar. Por ahora sólo guarda el email local.
    iniciarSesion(email);
    router.push("/lotes");
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between gap-6 px-4 pt-4 pb-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pizarra" aria-hidden />
          <span className="text-[13px] font-bold tracking-wider text-pizarra uppercase">
            Conexión segura
          </span>
        </div>
        <span className="shadow-sunken rounded-full bg-[#f2f3ff] px-2.5 py-1 text-[13px] font-semibold text-[#444651]">
          v1.0
        </span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-6">
        {/* Marca */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="clay-token clay-token--pizarra flex h-24 w-24 items-center justify-center">
            <span
              className="material-symbols-outlined text-pizarra text-[52px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              water_drop
            </span>
          </span>
          <div>
            <h1 className="text-[30px] font-extrabold tracking-tight text-tinta">
              Ventana de Aplicación
            </h1>
            <p className="mt-0.5 text-[14px] font-bold tracking-[0.2em] text-pizarra uppercase">
              Decisión agronómica
            </p>
          </div>
          <div className="shadow-sunken mt-1 max-w-[380px] rounded-xl bg-[#f4f6fa] px-4 py-3">
            <p className="text-[16px] leading-snug font-semibold text-tinta/80">
              🌾 <strong className="text-tinta">Guardá tus lotes</strong> y accedé desde
              cualquier dispositivo.
            </p>
          </div>
        </div>

        {/* Selector de paso */}
        <div className="shadow-sunken mx-auto flex w-full max-w-[380px] items-center gap-1 rounded-full bg-[#dae2fd] p-1">
          <button
            type="button"
            onClick={() => setPaso("formulario")}
            aria-current={paso === "formulario" ? "step" : undefined}
            className={`flex-1 rounded-full py-2 text-[14px] transition-all active:scale-[0.98] ${
              paso === "formulario"
                ? "shadow-extruded-sm bg-white font-bold text-pizarra"
                : "font-semibold text-[#444651]"
            }`}
          >
            1. Solicitar acceso
          </button>
          <button
            type="button"
            onClick={() => setPaso("enviado")}
            aria-current={paso === "enviado" ? "step" : undefined}
            className={`flex-1 rounded-full py-2 text-[14px] transition-all active:scale-[0.98] ${
              paso === "enviado"
                ? "shadow-extruded-sm bg-white font-bold text-pizarra"
                : "font-semibold text-[#444651]"
            }`}
          >
            2. Correo enviado
          </button>
        </div>

        {paso === "formulario" ? (
          <form onSubmit={enviarEnlace} className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[16px] font-bold tracking-wide text-tinta">
                Correo electrónico
              </span>
              <span className="neo-input-sunken flex items-center gap-3 rounded-2xl px-4 py-3.5">
                <span className="material-symbols-outlined shrink-0 text-[22px] text-[#757682]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="productor@establecimiento.com.ar"
                  className="w-full bg-transparent text-[17px] font-semibold text-tinta placeholder:text-tinta/40 outline-none"
                />
              </span>
              <span className="px-1 text-[13px] font-medium text-[#757682]">
                Te enviamos un link directo a tu correo. Sin contraseñas que recordar en
                cabina.
              </span>
            </label>

            {error ? (
              <div
                role="alert"
                className="shadow-extruded flex items-start gap-3 rounded-2xl bg-[#0f254e] p-4"
              >
                <span className="clay-token clay-token--bloqueo flex h-9 w-9 shrink-0 items-center justify-center">
                  <span
                    className="material-symbols-outlined text-bloqueo text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    priority_high
                  </span>
                </span>
                <div className="text-[14px]">
                  <p className="font-bold tracking-wide text-white uppercase">
                    Error de envío del link
                  </p>
                  <p className="mt-0.5 text-white/80">{error}</p>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={enviando}
              className="neo-btn-primary flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-[18px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              {enviando ? (
                <span>Generando enlace…</span>
              ) : (
                <>
                  <span>Enviarme el link de acceso</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={continuarSinCuenta}
              className="mx-auto text-[15px] font-bold text-[#444651] underline decoration-2 underline-offset-2 hover:text-pizarra"
            >
              ← Seguir sin cuenta (modo local en este dispositivo)
            </button>
          </form>
        ) : (
          <div className="shadow-extruded mx-auto flex w-full max-w-[420px] flex-col items-center gap-2 rounded-2xl bg-white p-6 text-center">
            <span className="clay-token clay-token--pizarra flex h-20 w-20 items-center justify-center">
              <span
                className="material-symbols-outlined text-pizarra text-[38px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mark_email_read
              </span>
            </span>
            <h2 className="text-[24px] font-extrabold text-tinta">¡Revisá tu correo!</h2>
            <p className="text-[15px] text-[#444651]">Te enviamos el enlace mágico a:</p>
            <p className="shadow-sunken rounded-lg bg-[#f2f3ff] px-3 py-1.5 text-[16px] font-bold break-all text-pizarra">
              {email || "productor@establecimiento.com.ar"}
            </p>
            <p className="text-[14px] text-[#757682]">
              Abrí el correo desde este dispositivo y tocá el botón para ingresar sin
              contraseña.
            </p>

            <button
              type="button"
              onClick={ingresar}
              className="neo-btn-primary mt-3 flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold text-white transition-transform active:scale-[0.98]"
            >
              <span>Acceder a la cabina</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={reenviar}
              disabled={reenviando}
              className="neo-btn-secondary flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold text-pizarra transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              {reenviando
                ? "Enviando nuevo enlace…"
                : reenviado
                  ? "¡Enlace reenviado con éxito!"
                  : "Reenviar enlace de acceso"}
            </button>
            <button
              type="button"
              onClick={() => setPaso("formulario")}
              className="mt-1 text-[14px] font-bold text-[#757682] underline"
            >
              Usar otro correo electrónico
            </button>
          </div>
        )}
      </main>

      <footer className="shadow-sunken flex items-start gap-2 rounded-lg bg-[#f2f3ff] px-3 py-2 text-[12px] leading-snug text-[#444651]">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-[#757682]">
          policy
        </span>
        <p>
          <strong className="text-tinta">AVISO LEGAL:</strong> Esta app describe condiciones
          meteorológicas y no reemplaza la receta fitosanitaria de un profesional agrónomo
          matriculado.
        </p>
      </footer>
    </div>
  );
}
