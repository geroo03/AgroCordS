/**
 * Preferencias de lectura: tipografía y tamaño de texto, elegidas desde
 * /ajustes y aplicadas a toda la app, no sólo a una pantalla.
 *
 * El tamaño se implementa como un multiplicador del font-size de <html>
 * (ver globals.css: `html { font-size: calc(16px * var(--escala-fuente)) }`).
 * Como la escala de Tailwind es en rem, esto agranda TODO junto — texto,
 * relleno, alto mínimo de toque — en vez de sólo la tipografía, que dejaría
 * los botones igual de chicos con letras más grandes.
 */

const CLAVE = "ventana.preferencias.v1";

export type FuenteId = "archivo" | "legible" | "redondeada" | "lectura";
export type TamanoFuente = "normal" | "grande" | "muy_grande";

export interface Preferencias {
  readonly fuente: FuenteId;
  readonly tamano: TamanoFuente;
}

const POR_DEFECTO: Preferencias = { fuente: "archivo", tamano: "normal" };

export const ETIQUETA_FUENTE: Record<FuenteId, { nombre: string; detalle: string }> = {
  archivo: { nombre: "Archivo", detalle: "La de siempre" },
  legible: { nombre: "Atkinson Hyperlegible", detalle: "Máxima legibilidad" },
  redondeada: { nombre: "Nunito", detalle: "Redondeada y cálida" },
  lectura: { nombre: "Lexend", detalle: "Pensada para leer rápido" },
};

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
  return typeof v.fuente === "string" && typeof v.tamano === "string";
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

/** Escribe las dos variables CSS que leen globals.css y los estilos inline. */
export function aplicarPreferencias(p: Preferencias): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--fuente-activa", `var(--font-${p.fuente})`);
  document.documentElement.style.setProperty("--escala-fuente", String(ESCALA_TAMANO[p.tamano]));
}
