/**
 * Plan del usuario: gratis o premium.
 *
 * Con sesión de Supabase activa, el plan vive en el backend
 * (tabla `plan_usuario`, ver server/) y estas funciones son async de
 * verdad. Sin sesión ("Seguir sin cuenta", modo local — el único camino que
 * existía antes de conectar el backend) siguen leyendo/escribiendo
 * localStorage, envueltas en una Promise para que el resto de la app use
 * una sola forma de llamarlas sin importar el modo.
 *
 * "Activar Premium (demo)" sigue siendo una simulación explícita en ambos
 * modos: no hay cobro real detrás salvo cuando el pago onchain (Twin
 * Finance) queda confirmado en la red — ahí sí se guarda el comprobante.
 */

import { actualizarPlanRemoto, obtenerPlanRemoto } from "./api/cliente";
import { obtenerSesionActual } from "./supabaseClient";

const CLAVE_PLAN = "ventana.plan.v1";

export type PlanNombre = "gratis" | "premium";
export type Moneda = "ARGt" | "BRAt";

export interface Comprobante {
  readonly hash: string;
  readonly moneda: Moneda;
}

function leerPlanLocal(): PlanNombre {
  if (typeof window === "undefined") return "gratis";
  try {
    return window.localStorage.getItem(CLAVE_PLAN) === "premium" ? "premium" : "gratis";
  } catch {
    return "gratis";
  }
}

function escribirPlanLocal(plan: PlanNombre): void {
  try {
    window.localStorage.setItem(CLAVE_PLAN, plan);
  } catch {
    // Almacenamiento bloqueado: la demo sigue, sin persistir.
  }
}

export async function obtenerPlan(): Promise<PlanNombre> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return leerPlanLocal();
  try {
    return (await obtenerPlanRemoto()).plan;
  } catch {
    // Backend caído o sin configurar: nunca se inventa un plan, se degrada
    // a "gratis" en vez de romper la pantalla.
    return "gratis";
  }
}

export async function esPremium(): Promise<boolean> {
  return (await obtenerPlan()) === "premium";
}

export async function activarPremium(comprobante?: Comprobante): Promise<void> {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    escribirPlanLocal("premium");
    return;
  }
  try {
    await actualizarPlanRemoto({
      plan: "premium",
      pagoHash: comprobante?.hash ?? null,
      pagoMoneda: comprobante?.moneda ?? null,
      pagoVerificadoEn: comprobante ? new Date().toISOString() : null,
    });
  } catch {
    // Sin red, el intento del usuario no se pierde: cae a local de respaldo.
    escribirPlanLocal("premium");
  }
}

export async function desactivarPremium(): Promise<void> {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    escribirPlanLocal("gratis");
    return;
  }
  try {
    await actualizarPlanRemoto({ plan: "gratis" });
  } catch {
    escribirPlanLocal("gratis");
  }
}
