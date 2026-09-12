"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Boton from "@/components/ui/Boton";
import IconoClay from "@/components/ui/IconoClay";
import {
  GlifoAgua,
  GlifoAlerta,
  GlifoCorreo,
  GlifoCorreoAbierto,
  GlifoFlechaDerecha,
  GlifoRefrescar,
} from "@/components/ui/iconos/Glifos";
import { iniciarSesion } from "@/lib/sesion";

type Paso = "formulario" | "enviado";

const REGEX_EMAIL = /^\S+@\S+\.\S+$/;

/**
 * Login por magic link (sin contraseña). Todavía no hay backend de
 * autenticación conectado desde acá: el envío y el ingreso están simulados
 * con timeouts, marcados con TODO(backend) donde hay que enchufar la API
 * real (el backend Express con Supabase Auth ya existe en server/, ver
 * README — falta este último tramo del lado del navegador).
 * "Seguir sin cuenta" lleva al modo local actual (localStorage en este
 * dispositivo), que es como funciona hoy toda la app.
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

    // TODO(backend): reemplazar por supabase.auth.signInWithOtp({ email }).
    setTimeout(() => {
      setEnviando(false);
      setPaso("enviado");
    }, 650);
  };

  const reenviar = () => {
    setReenviando(true);
    setReenviado(false);
    // TODO(backend): reemplazar por el reenvío real del enlace.
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
    <div className="flex min-h-dvh flex-col justify-between gap-6 px-5 pt-8 pb-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pizarra" aria-hidden />
          <span className="text-xs font-bold tracking-wider text-pizarra uppercase">
            Conexión segura
          </span>
        </div>
        <span className="clay-hundido rounded-full px-2.5 py-1 text-xs font-semibold text-tinta/70">
          v1.0
        </span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-6">
        {/* Marca */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="clay-tono-azul clay-insignia flex h-20 w-20 items-center justify-center rounded-3xl">
            <span className="h-10 w-10">
              <GlifoAgua />
            </span>
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
              Ventana de Aplicación
            </h1>
            <p className="mt-0.5 text-xs font-bold tracking-[0.2em] text-pizarra uppercase">
              Decisión agronómica
            </p>
          </div>
          <div className="clay-hundido mt-1 max-w-[380px] rounded-xl p-4">
            <p className="text-base leading-snug font-semibold text-tinta/80">
              <strong className="text-tinta">Guardá tus lotes</strong> y accedé desde cualquier
              dispositivo.
            </p>
          </div>
        </div>

        {/* Selector de paso */}
        <div className="clay-hundido mx-auto flex w-full max-w-[380px] items-center gap-1 rounded-full p-1">
          <button
            type="button"
            onClick={() => setPaso("formulario")}
            aria-current={paso === "formulario" ? "step" : undefined}
            className={`flex-1 rounded-full py-2 text-sm transition-all active:scale-[0.98] ${
              paso === "formulario" ? "clay-elevado font-bold text-pizarra" : "font-semibold text-tinta/60"
            }`}
          >
            1. Solicitar acceso
          </button>
          <button
            type="button"
            onClick={() => setPaso("enviado")}
            aria-current={paso === "enviado" ? "step" : undefined}
            className={`flex-1 rounded-full py-2 text-sm transition-all active:scale-[0.98] ${
              paso === "enviado" ? "clay-elevado font-bold text-pizarra" : "font-semibold text-tinta/60"
            }`}
          >
            2. Correo enviado
          </button>
        </div>

        {paso === "formulario" ? (
          <form onSubmit={enviarEnlace} className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-base font-bold tracking-wide text-tinta">Correo electrónico</span>
              <span className="clay-hundido flex min-h-14 items-center gap-3 rounded-2xl px-4">
                <span className="h-5 w-5 shrink-0 text-tinta/50">
                  <GlifoCorreo />
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="productor@establecimiento.com.ar"
                  className="w-full bg-transparent text-base font-semibold text-tinta placeholder:text-tinta/40 outline-none"
                />
              </span>
              <span className="px-1 text-xs font-medium text-tinta/60">
                Te enviamos un link directo a tu correo. Sin contraseñas que recordar en cabina.
              </span>
            </label>

            {error ? (
              <div role="alert" className="clay-elevado flex items-start gap-3 rounded-2xl p-4">
                <span className="h-6 w-6 shrink-0 text-bloqueo">
                  <GlifoAlerta />
                </span>
                <div className="text-sm">
                  <p className="font-bold tracking-wide text-bloqueo uppercase">
                    Error de envío del link
                  </p>
                  <p className="mt-0.5 text-tinta/70">{error}</p>
                </div>
              </div>
            ) : null}

            <Boton type="submit" disabled={enviando} className="flex w-full items-center justify-center gap-2">
              {enviando ? (
                <span>Generando enlace…</span>
              ) : (
                <>
                  <span>Enviarme el link de acceso</span>
                  <span className="h-5 w-5">
                    <GlifoFlechaDerecha />
                  </span>
                </>
              )}
            </Boton>

            <button
              type="button"
              onClick={continuarSinCuenta}
              className="mx-auto text-sm font-bold text-tinta/60 underline decoration-2 underline-offset-2 hover:text-pizarra"
            >
              ← Seguir sin cuenta (modo local en este dispositivo)
            </button>
          </form>
        ) : (
          <div className="clay-elevado mx-auto flex w-full max-w-[420px] flex-col items-center gap-2 rounded-2xl p-6 text-center">
            <span className="clay-tono-azul clay-insignia flex h-16 w-16 items-center justify-center rounded-3xl">
              <span className="h-8 w-8">
                <GlifoCorreoAbierto />
              </span>
            </span>
            <h2 className="text-xl font-extrabold text-tinta">¡Revisá tu correo!</h2>
            <p className="text-sm text-tinta/70">Te enviamos el enlace mágico a:</p>
            <p className="clay-hundido rounded-lg px-3 py-1.5 text-base font-bold break-all text-pizarra">
              {email || "productor@establecimiento.com.ar"}
            </p>
            <p className="text-xs text-tinta/60">
              Abrí el correo desde este dispositivo y tocá el botón para ingresar sin contraseña.
            </p>

            <Boton onClick={ingresar} className="mt-3 flex w-full items-center justify-center gap-2">
              <span>Acceder a la cabina</span>
              <span className="h-5 w-5">
                <GlifoFlechaDerecha />
              </span>
            </Boton>
            <Boton
              variante="secundario"
              onClick={reenviar}
              disabled={reenviando}
              className="flex w-full items-center justify-center gap-2"
            >
              <span className="h-5 w-5">
                <GlifoRefrescar />
              </span>
              {reenviando
                ? "Enviando nuevo enlace…"
                : reenviado
                  ? "¡Enlace reenviado con éxito!"
                  : "Reenviar enlace de acceso"}
            </Boton>
            <button
              type="button"
              onClick={() => setPaso("formulario")}
              className="mt-1 text-sm font-bold text-tinta/60 underline"
            >
              Usar otro correo electrónico
            </button>
          </div>
        )}
      </main>

      <footer className="clay-hundido flex items-start gap-2 rounded-lg p-3 text-xs leading-snug text-tinta/70">
        <IconoClay tono="neutro" tamano="sm">
          <GlifoAlerta />
        </IconoClay>
        <p className="pt-1">
          <strong className="text-tinta">Aviso legal:</strong> Esta app describe condiciones
          meteorológicas y no reemplaza la receta fitosanitaria de un profesional agrónomo
          matriculado.
        </p>
      </footer>
    </div>
  );
}
