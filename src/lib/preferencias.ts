/**
 * Preferencia de lectura: tamaño de texto, elegido desde /ajustes y aplicado
 * a toda la app, no sólo a una pantalla.
 *
 * La tipografía dejó de ser elegible con el rediseño AgroCordS: el sistema
 * de diseño define una sola familia (Space Grotesk, ver globals.css/layout.tsx)
 * como parte de su identidad, no un selector entre varias. Lo que sigue
 * siendo una preferencia real es el tamaño — accesibilidad, no estética.
 *
 * El tamaño se implementa como un multiplicador del font-size de <html>
 * (ver globals.css: `html { font-size: calc(16px * var(--escala-fuente)) }`).
 * Como la escala de Tailwind es en rem, esto agranda TODO junto — texto,
 * relleno, alto mínimo de toque — en vez de sólo la tipografía, que dejaría
 * los botones igual de chicos con letras más grandes.
 */

const CLAVE = "ventana.preferencias.v1";

export type TamanoFuente = "normal" | "grande" | "muy_grande";

export interface Preferencias {
  readonly tamano: TamanoFuente;
}

const POR_DEFECTO: Preferencias = { tamano: "normal" };

export const ETIQUETA_TAMANO: Record<TamanoFuente, string> = {
  normal: "Normal",
  grande: "Grande",
  muy_grande: "Muy grande",
};

export const ESCALA_TAMANO: Record<TamanoFuente, number> = {
  normal: 1,
  grande: 1.15,
  muy_grande: 1.3,
};

function esValida(valor: unknown): valor is Preferencias {
  if (!valor || typeof valor !== "object") return false;
  const v = valor as Record<string, unknown>;
  return typeof v.tamano === "string";
}

export function leerPreferencias(): Preferencias {
  if (typeof window === "undefined") return POR_DEFECTO;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    const parsed: unknown = crudo ? JSON.parse(crudo) : null;
    return esValida(parsed) ? parsed : POR_DEFECTO;
  } catch {
    return POR_DEFECTO;
  }
}

export function guardarPreferencias(p: Preferencias): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(p));
  } catch {
    // Almacenamiento bloqueado o lleno: la preferencia no persiste, pero se
    // aplica igual en esta sesión.
  }
}

/** Escribe la variable CSS que lee globals.css. */
export function aplicarPreferencias(p: Preferencias): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--escala-fuente", String(ESCALA_TAMANO[p.tamano]));
}
