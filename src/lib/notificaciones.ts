/**
 * Notificaciones de ventana de aplicación — función Premium.
 *
 * Usa la Notification API del navegador: avisa mientras la pestaña está
 * abierta (o en segundo plano en el mismo dispositivo). Es un prototipo
 * deliberado, no push real: producción necesitaría Web Push (service
 * worker + claves VAPID + un disparador en el servidor) para avisar con la
 * app cerrada. Esa distinción se dice en la UI, mismo criterio de
 * honestidad que ya se aplica a NDVI/NDRE.
 *
 * No inventa ventanas: sólo lee las que ya calculó `findWindows` en el
 * motor y compara contra la hora local, con el mismo patrón de comparación
 * de cadenas ISO locales que usa `/api/forecast` (nunca `new Date()` sobre
 * las horas del pronóstico).
 */

import type { SprayWindow } from "./spray-engine";
import type { Lote } from "./tipos";

const CLAVE_NOTIFICADAS = "ventana.notificadas.v1";
const TOPE_CLAVES_GUARDADAS = 200;

export function permisoDisponible(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permisoActual(): NotificationPermission | "no_disponible" {
  return permisoDisponible() ? Notification.permission : "no_disponible";
}

export async function pedirPermiso(): Promise<NotificationPermission> {
  if (!permisoDisponible()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/** 'YYYY-MM-DDTHH:00' en hora LOCAL del navegador, para comparar contra las
 * horas locales del pronóstico (nunca se convierten a Date). */
function horaLocalIso(): string {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:00`;
}

/** Pura y testeable: ¿la ventana cubre la hora local dada? */
export function estaVentanaAbierta(ventana: SprayWindow, horaLocal: string): boolean {
  return horaLocal >= ventana.startTime && horaLocal <= ventana.endTime;
}

function yaNotificada(clave: string): boolean {
  try {
    const guardadas: string[] = JSON.parse(
      window.localStorage.getItem(CLAVE_NOTIFICADAS) ?? "[]",
    );
    return guardadas.includes(clave);
  } catch {
    return false;
  }
}

function marcarNotificada(clave: string): void {
  try {
    const guardadas: string[] = JSON.parse(
      window.localStorage.getItem(CLAVE_NOTIFICADAS) ?? "[]",
    );
    const actualizadas = [...guardadas, clave].slice(-TOPE_CLAVES_GUARDADAS);
    window.localStorage.setItem(CLAVE_NOTIFICADAS, JSON.stringify(actualizadas));
  } catch {
    // Sin persistencia, en el peor caso se repite un aviso en esta sesión.
  }
}

/**
 * Si la mejor ventana de un lote está abierta AHORA y todavía no se avisó
 * para ese lote+ventana, dispara una notificación del navegador.
 */
export function avisarSiVentanaAbierta(lote: Lote, mejorVentana: SprayWindow | null): void {
  if (!mejorVentana) return;
  if (!permisoDisponible() || Notification.permission !== "granted") return;
  if (!estaVentanaAbierta(mejorVentana, horaLocalIso())) return;

  const clave = `${lote.id}·${mejorVentana.startTime}`;
  if (yaNotificada(clave)) return;

  new Notification(`Ventana abierta — ${lote.nombre}`, {
    body: `${mejorVentana.hours} h disponibles · puntaje ${mejorVentana.averageScore}.`,
    tag: clave,
  });
  marcarNotificada(clave);
}
