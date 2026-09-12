/**
 * Sesión del productor: sólo el email, guardado en localStorage.
 *
 * Todavía no hay backend de autenticación (ver `app/login/page.tsx`):
 * `iniciarSesion` se llama recién cuando el flujo de magic link "confirma"
 * el ingreso, como una SIMULACIÓN explícita para la demo — no valida ningún
 * token real. En producción esto vendría de una sesión validada en el
 * servidor, pero la interfaz — `obtenerSesion()` / `cerrarSesion()` — no
 * cambiaría: mismo aislamiento que `plan.ts` usa para poder reemplazar
 * localStorage por Supabase sin tocar el resto de la app.
 *
 * "Seguir sin cuenta" (modo local) no llama a `iniciarSesion`: ese modo no
 * tiene email ni sesión, y por lo tanto no muestra el botón de desconexión.
 */

const CLAVE_SESION = "ventana.sesion.email.v1";

export function iniciarSesion(email: string): void {
  try {
    window.localStorage.setItem(CLAVE_SESION, email);
  } catch {
    // Almacenamiento bloqueado: la sesión no persiste, pero no rompe el flujo.
  }
}

export function cerrarSesion(): void {
  try {
    window.localStorage.removeItem(CLAVE_SESION);
  } catch {
    // no-op
  }
}

export function obtenerSesion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CLAVE_SESION);
  } catch {
    return null;
  }
}
