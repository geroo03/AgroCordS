/**
 * Cliente HTTP hacia el backend (server/), única frontera con él — mismo
 * criterio que openmeteo.ts o chat/groq.ts. Cada función espeja una ruta
 * exacta del backend (ver server/README.md); las formas de ida y vuelta ya
 * coinciden con los tipos de dominio de la app (Lote, Aplicacion, etc.), sin
 * traducción de campos.
 *
 * `SinSesionError` es la señal para que almacen.ts/plan.ts/chat/limite.ts
 * caigan a localStorage: sin sesión de Supabase no hay `user_id` con el que
 * filtrar, así que ni siquiera se intenta la llamada de red.
 */

import { obtenerSesionActual } from "../supabaseClient";
import type { ProductType } from "../spray-engine";
import type { Aplicacion, Lote } from "../tipos";
import type { Moneda, PlanNombre } from "../plan";

export class SinSesionError extends Error {
  constructor() {
    super("No hay una sesión activa.");
    this.name = "SinSesionError";
  }
}

export class ErrorApiRemota extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ErrorApiRemota";
  }
}

async function peticion<T>(path: string, opciones: RequestInit = {}): Promise<T> {
  const sesion = await obtenerSesionActual();
  if (!sesion) throw new SinSesionError();

  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ErrorApiRemota("Falta configurar NEXT_PUBLIC_API_URL.");

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...opciones,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sesion.access_token}`,
        ...opciones.headers,
      },
    });
  } catch {
    throw new ErrorApiRemota("No se pudo contactar al servidor.", undefined);
  }

  if (!res.ok) {
    throw new ErrorApiRemota(`El servidor respondió ${res.status}.`, res.status);
  }
  return (await res.json()) as T;
}

// ── Lotes ────────────────────────────────────────────────────

export function listarLotesRemoto(): Promise<Lote[]> {
  return peticion<Lote[]>("/lotes");
}

export function obtenerLoteRemoto(id: string): Promise<Lote | null> {
  return peticion<Lote>(`/lotes/${id}`).catch((err) => {
    if (err instanceof ErrorApiRemota && err.status === 404) return null;
    throw err;
  });
}

export interface NuevoLoteRemoto {
  readonly nombre: string;
  readonly cultivo: string | null;
  readonly fechaSiembra: string | null;
  readonly geometry: unknown;
  readonly centroidLat: number;
  readonly centroidLng: number;
  readonly areaHa: number;
}

export function crearLoteRemoto(datos: NuevoLoteRemoto): Promise<Lote> {
  return peticion<Lote>("/lotes", { method: "POST", body: JSON.stringify(datos) });
}

// ── Aplicaciones ─────────────────────────────────────────────

export function listarAplicacionesRemoto(): Promise<Aplicacion[]> {
  return peticion<Aplicacion[]>("/aplicaciones");
}

export function listarAplicacionesDeLoteRemoto(loteId: string): Promise<Aplicacion[]> {
  return peticion<Aplicacion[]>(`/lotes/${loteId}/aplicaciones`);
}

export interface NuevaAplicacionRemota {
  readonly loteId: string;
  readonly productoNombre: string;
  readonly tipoProducto: ProductType;
  readonly condiciones: unknown;
  readonly notas: string | null;
}

export function crearAplicacionRemota(datos: NuevaAplicacionRemota): Promise<Aplicacion> {
  return peticion<Aplicacion>("/aplicaciones", { method: "POST", body: JSON.stringify(datos) });
}

// ── Plan ─────────────────────────────────────────────────────

export interface PlanRemoto {
  readonly plan: PlanNombre;
  readonly actualizadoEn: string;
  readonly pagoHash: string | null;
  readonly pagoMoneda: Moneda | null;
  readonly pagoVerificadoEn: string | null;
}

export function obtenerPlanRemoto(): Promise<PlanRemoto> {
  return peticion<PlanRemoto>("/plan");
}

export interface ActualizarPlanRemoto {
  readonly plan: PlanNombre;
  readonly pagoHash?: string | null;
  readonly pagoMoneda?: Moneda | null;
  readonly pagoVerificadoEn?: string | null;
}

export function actualizarPlanRemoto(datos: ActualizarPlanRemoto): Promise<PlanRemoto> {
  return peticion<PlanRemoto>("/plan", { method: "PUT", body: JSON.stringify(datos) });
}

// ── Uso del chat ─────────────────────────────────────────────

export interface UsoChatRemoto {
  readonly fecha: string;
  readonly consultas: number;
}

export function obtenerUsoChatRemoto(): Promise<UsoChatRemoto> {
  return peticion<UsoChatRemoto>("/chat/uso");
}

export function incrementarUsoChatRemoto(): Promise<UsoChatRemoto> {
  return peticion<UsoChatRemoto>("/chat/uso", { method: "POST" });
}

// ── Notificaciones ───────────────────────────────────────────

export interface NotificacionRemota {
  readonly loteId: string;
  readonly ventanaInicio: string;
}

export function listarNotificacionesRemoto(): Promise<NotificacionRemota[]> {
  return peticion<NotificacionRemota[]>("/notificaciones");
}

export function registrarNotificacionRemoto(datos: NotificacionRemota): Promise<NotificacionRemota> {
  return peticion<NotificacionRemota>("/notificaciones", { method: "POST", body: JSON.stringify(datos) });
}
