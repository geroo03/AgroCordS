/**
 * Límite de consultas gratis al chatbot: 5 por día, por dispositivo.
 *
 * Sin backend ni cuentas, el límite vive en localStorage — mismo modelo de
 * confianza que `plan.ts` ("Activar Premium" es una simulación local, no un
 * cobro real). La lógica de fecha/conteo es pura y separada del acceso a
 * localStorage, igual que `spray-engine.ts` (puro) se separa de
 * `openmeteo.ts` (I/O): así se puede testear sin `window`.
 */

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

function leerUso(): UsoChatGuardado | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_USO_CHAT);
    return crudo ? (JSON.parse(crudo) as UsoChatGuardado) : null;
  } catch {
    return null;
  }
}

function escribirUso(uso: UsoChatGuardado): void {
  try {
    window.localStorage.setItem(CLAVE_USO_CHAT, JSON.stringify(uso));
  } catch {
    // Almacenamiento bloqueado: la sesión sigue, sin persistir el conteo.
  }
}

export function consultasRestantesHoy(premium: boolean): number {
  const guardado = leerUso();
  return calcularConsultasRestantes(guardado?.consultas ?? 0, guardado?.fecha ?? null, hoyIso(), premium);
}

export function registrarConsultaChat(): void {
  const hoy = hoyIso();
  const guardado = leerUso();
  const consultasPrevias = guardado?.fecha === hoy ? guardado.consultas : 0;
  escribirUso({ fecha: hoy, consultas: consultasPrevias + 1 });
}
