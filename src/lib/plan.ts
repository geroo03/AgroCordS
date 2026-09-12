/**
 * Plan del usuario: gratis o premium.
 *
 * Bandera local en localStorage, sin backend ni pago real: "Activar
 * Premium" en `Paywall.tsx` es una SIMULACIÓN explícita para la demo, no
 * procesa ningún cobro ni credencial de pago. En producción esto vendría de
 * una suscripción real (Mercado Pago/Stripe) validada en el servidor, pero
 * la interfaz — `esPremium()` / `activarPremium()` — no cambiaría: mismo
 * aislamiento que `almacen.ts` usa para poder reemplazar localStorage por
 * Supabase sin tocar el resto de la app.
 */

const CLAVE_PLAN = "ventana.plan.v1";

export type Plan = "gratis" | "premium";

export function obtenerPlan(): Plan {
  if (typeof window === "undefined") return "gratis";
  try {
    return window.localStorage.getItem(CLAVE_PLAN) === "premium" ? "premium" : "gratis";
  } catch {
    return "gratis";
  }
}

export function esPremium(): boolean {
  return obtenerPlan() === "premium";
}

export function activarPremium(): void {
  try {
    window.localStorage.setItem(CLAVE_PLAN, "premium");
  } catch {
    // Almacenamiento bloqueado: la demo sigue en plan gratis.
  }
}

export function desactivarPremium(): void {
  try {
    window.localStorage.setItem(CLAVE_PLAN, "gratis");
  } catch {
    // no-op
  }
}
