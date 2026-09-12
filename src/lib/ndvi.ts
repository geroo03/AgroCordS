/**
 * Dominio de vigor vegetativo: NDVI y NDRE.
 *
 * NDVI (Índice de Vegetación de Diferencia Normalizada) resume la biomasa
 * fotosintética activa del lote; es el indicador de referencia para vigor
 * temprano, pero se satura cuando el canopeo ya cubre el suelo. NDRE (Índice
 * de Borde Rojo) usa la banda red edge en vez de rojo: no se satura tan
 * rápido y es más sensible a clorofila y nitrógeno en etapas avanzadas,
 * justo cuando NDVI ya no distingue variación dentro del lote.
 *
 * Los datos reales vienen de Sentinel-2 vía `lib/satelital/` (Copernicus
 * Data Space + Sentinel Hub). `generarSerieDemo` queda como FALLBACK: se usa
 * sólo cuando no hay credenciales configuradas o el proveedor falla, y la
 * serie resultante viaja marcada con `real: false` para que la UI nunca la
 * confunda con una medición. Simula una curva estacional plausible,
 * determinística por semilla — no es un dato.
 */

export type NivelVigor = "bajo" | "medio" | "alto";

export interface LecturaNdvi {
  /** ISO 'YYYY-MM-DD'. */
  readonly fecha: string;
  /** -1 a 1; un cultivo sano en pleno canopeo ronda 0,6-0,9. */
  readonly ndvi: number;
  /** 0 a ~0,5; más sensible que NDVI en etapas avanzadas. */
  readonly ndre: number;
}

export const ETIQUETA_VIGOR: Record<NivelVigor, string> = {
  alto: "Vigor alto",
  medio: "Vigor medio",
  bajo: "Vigor bajo",
};

/**
 * Umbrales orientativos para cultivos extensivos en pleno desarrollo
 * vegetativo. Varían por cultivo, etapa fenológica y densidad de siembra:
 * un ingeniero agrónomo debe ajustarlos antes de usarlos como diagnóstico,
 * igual que los umbrales de `spray-engine.ts`.
 */
const UMBRAL_VIGOR = { bajo: 0.35, medio: 0.6 } as const;

export function clasificarVigor(ndvi: number): NivelVigor {
  if (ndvi < UMBRAL_VIGOR.bajo) return "bajo";
  if (ndvi < UMBRAL_VIGOR.medio) return "medio";
  return "alto";
}

/** Generador determinístico (mulberry32) a partir de una semilla de texto. */
function crearGeneradorDeterministico(semilla: string): () => number {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let estado = h >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIA_MS = 86_400_000;
const VENTANA_DIAS = 130;
const PASO_DIAS = 10;

/**
 * Serie de demostración: una lectura cada ~10 días en los últimos ~130 días,
 * con una curva estacional (siembra → pico vegetativo → senescencia) y ruido
 * determinístico por lote: cada lote tiene su propia curva, estable entre
 * recargas, pero ninguna es una medición real.
 */
export function generarSerieDemo(semilla: string): LecturaNdvi[] {
  const azar = crearGeneradorDeterministico(semilla);
  const diaPico = VENTANA_DIAS * (0.45 + azar() * 0.25);
  const ndviMax = 0.72 + azar() * 0.15;
  const hoy = Date.now();
  const lecturas: LecturaNdvi[] = [];

  for (let diasAtras = VENTANA_DIAS; diasAtras >= 0; diasAtras -= PASO_DIAS) {
    const diaDeCiclo = VENTANA_DIAS - diasAtras;
    // Curva en forma de campana alrededor del pico vegetativo.
    const progreso = Math.max(0, 1 - Math.abs(diaDeCiclo - diaPico) / diaPico);
    const base = 0.15 + progreso * (ndviMax - 0.15);
    const ndvi = clamp(base + (azar() - 0.5) * 0.05, 0.1, 0.95);
    // NDRE corre por debajo de NDVI y se satura menos: no es una relación
    // lineal real, pero alcanza para que la demo sea coherente.
    const ndre = clamp(ndvi * 0.55 + (azar() - 0.5) * 0.04, 0.05, 0.6);

    lecturas.push({
      fecha: new Date(hoy - diasAtras * DIA_MS).toISOString().slice(0, 10),
      ndvi: Math.round(ndvi * 100) / 100,
      ndre: Math.round(ndre * 100) / 100,
    });
  }

  return lecturas;
}

/** Última entrada de una serie ordenada por fecha (demo o satelital). */
export function ultimaLectura<T extends { fecha: string }>(serie: readonly T[]): T | null {
  return serie.length > 0 ? serie[serie.length - 1] : null;
}

function clamp(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}
