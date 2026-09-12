/**
 * Reconocimiento del cultivo declarado en el lote.
 *
 * `Lote.cultivo` es texto libre: el productor escribe "Soja", "soja de
 * segunda", "Trigo candeal", "Maíz tardío". Los módulos que dependen del
 * cultivo (grados día, helada, coeficiente de cultivo) necesitan resolver ese
 * texto a una de las especies que saben tratar, y antes cada uno traía su
 * propia copia de la normalización con comparación exacta — así "Trigo
 * candeal" caía en el default de soja y el cálculo salía con la base térmica
 * equivocada, en silencio.
 *
 * Acá vive una sola vez, y por coincidencia parcial en vez de igualdad: lo
 * que importa es la especie, no la variedad.
 */

export type CultivoConocido = "soja" | "maiz" | "trigo";

/** Especie que se usa cuando el texto no coincide con ninguna conocida. */
export const CULTIVO_POR_DEFECTO: CultivoConocido = "soja";

const ALIAS: ReadonlyArray<readonly [CultivoConocido, readonly string[]]> = [
  ["trigo", ["trigo"]],
  ["maiz", ["maiz", "choclo"]],
  ["soja", ["soja", "soya"]],
];

/** Minúsculas y sin acentos: "Maíz tardío" → "maiz tardio". */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Resuelve el texto libre a una especie conocida. Devuelve `null` cuando no
 * reconoce ninguna, para que quien llame decida si usar el default o avisar
 * que el cultivo no se reconoció.
 */
export function reconocerCultivo(cultivo: string | null): CultivoConocido | null {
  if (!cultivo) return null;
  const texto = normalizarTexto(cultivo);
  for (const [especie, alias] of ALIAS) {
    if (alias.some((a) => texto.includes(a))) return especie;
  }
  return null;
}

/** Como `reconocerCultivo`, pero cae al default en vez de devolver `null`. */
export function cultivoODefecto(cultivo: string | null): CultivoConocido {
  return reconocerCultivo(cultivo) ?? CULTIVO_POR_DEFECTO;
}

/**
 * Coeficiente de cultivo (Kc) para el balance hídrico. Valor único por
 * especie que aproxima la etapa de mayor demanda: no modela la curva
 * fenológica completa de FAO-56, y está declarado como aproximación en la
 * pantalla que lo usa.
 */
export const KC_POR_CULTIVO: Record<CultivoConocido, number> = {
  soja: 0.8,
  maiz: 1,
  trigo: 0.95,
};

export function kcParaCultivo(cultivo: string | null): number {
  return KC_POR_CULTIVO[cultivoODefecto(cultivo)];
}
