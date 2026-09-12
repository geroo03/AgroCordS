/**
 * Límite de consultas gratis al chatbot: 5 por día.
 *
 * Con sesión de Supabase, el conteo vive en el backend (tabla
 * `uso_chat_diario`) — una mejora real sobre el modo local: pasa a ser por
 * cuenta, entre todos los dispositivos, en vez de por dispositivo. Sin
 * sesión ("Seguir sin cuenta") sigue en localStorage, único modo que existía
 * antes de conectar el backend.
 *
 * La lógica de fecha/conteo (`calcularConsultasRestantes`) es pura y
 * separada del I/O, igual que `spray-engine.ts` se separa de
 * `openmeteo.ts`: así se puede testear sin `window` ni red.
 */

import { incrementarUsoChatRemoto, obtenerUsoChatRemoto } from "../api/cliente";
import { obtenerSesionActual } from "../supabaseClient";

export const LIMITE_GRATIS_DIARIO = 5;

const CLAVE_USO_CHAT = "ventana.chat.uso.v1";

interface UsoChatGuardado {
  readonly fecha: string;
  readonly consultas: number;
}

/**
 * Cuántas consultas quedan hoy. `premium: true` no tiene límite.
 * `fechaGuardada`/`usoHoy` vienen de lo último persistido: si la fecha
 * guardada no es la de hoy, el contador arrancó de nuevo (día distinto).
 */
export function calcularConsultasRestantes(
  usoHoy: number,
  fechaGuardada: string | null,
  hoy: string,
  premium: boolean,
): number {
  if (premium) return Infinity;
  const consultasDeHoy = fechaGuardada === hoy ? usoHoy : 0;
  return Math.max(0, LIMITE_GRATIS_DIARIO - consultasDeHoy);
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function leerUsoLocal(): UsoChatGuardado | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_USO_CHAT);
    return crudo ? (JSON.parse(crudo) as UsoChatGuardado) : null;
  } catch {
    return null;
  }
}

function escribirUsoLocal(uso: UsoChatGuardado): void {
  try {
    window.localStorage.setItem(CLAVE_USO_CHAT, JSON.stringify(uso));
  } catch {
    // Almacenamiento bloqueado: la sesión sigue, sin persistir el conteo.
  }
}

export async function consultasRestantesHoy(premium: boolean): Promise<number> {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    const guardado = leerUsoLocal();
    return calcularConsultasRestantes(guardado?.consultas ?? 0, guardado?.fecha ?? null, hoyIso(), premium);
  }
  try {
    const remoto = await obtenerUsoChatRemoto();
    return calcularConsultasRestantes(remoto.consultas, remoto.fecha, hoyIso(), premium);
  } catch {
    return calcularConsultasRestantes(0, null, hoyIso(), premium);
  }
}

export async function registrarConsultaChat(): Promise<void> {
  const sesion = await obtenerSesionActual();
  if (sesion) {
    try {
      await incrementarUsoChatRemoto();
      return;
    } catch {
      // Sin red, la consulta ya se hizo — se cuenta local para no perder el
      // registro del límite, aunque quede desincronizada con el backend.
    }
  }
  const hoy = hoyIso();
  const guardado = leerUsoLocal();
  const consultasPrevias = guardado?.fecha === hoy ? guardado.consultas : 0;
  escribirUsoLocal({ fecha: hoy, consultas: consultasPrevias + 1 });
}
