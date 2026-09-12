/**
 * Cache en memoria del proceso servidor, con TTL.
 *
 * Alcanza para la demo (un único proceso Next.js). En producción con varias
 * instancias, reemplazar por Redis o una tabla de Supabase conservando esta
 * misma interfaz (`obtenerDeCache` / `guardarEnCache`): el resto del módulo
 * no sabe dónde vive el cache.
 */

interface Entrada<T> {
  valor: T;
  expiraEn: number;
}

const almacen = new Map<string, Entrada<unknown>>();

export function obtenerDeCache<T>(clave: string): T | null {
  const entrada = almacen.get(clave);
  if (!entrada) return null;
  if (Date.now() > entrada.expiraEn) {
    almacen.delete(clave);
    return null;
  }
  return entrada.valor as T;
}

export function guardarEnCache<T>(clave: string, valor: T, ttlMs: number): void {
  almacen.set(clave, { valor, expiraEn: Date.now() + ttlMs });
}

/** Hash estable (FNV-1a de 32 bits) para armar claves a partir del polígono. */
export function hashEstable(texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/** Sólo para tests: vacía el cache entre casos. */
export function _limpiarCacheParaTests(): void {
  almacen.clear();
}
