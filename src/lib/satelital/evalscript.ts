/**
 * Evalscript (v3) de Sentinel Hub para la Statistical API sobre Sentinel-2 L2A.
 *
 * Bandas usadas (resolución nativa entre paréntesis):
 *   B04 — Red,        ~665 nm (10 m)
 *   B05 — Red Edge 1, ~705 nm (20 m)
 *   B08 — NIR,        ~842 nm (10 m)
 *   SCL — Scene Classification Layer (20 m): clase de cada píxel.
 *   dataMask — 1 si el píxel tiene dato y está dentro del polígono, 0 si no.
 *
 * Índices (misma fórmula que `indices.ts`):
 *   NDVI = (B08 − B04) / (B08 + B04)
 *   NDRE = (B08 − B05) / (B08 + B05)
 *
 * ── Máscara ──────────────────────────────────────────────────
 * El píxel se descarta (dataMask final = 0) cuando:
 *
 * a) SCL lo clasifica en alguna de las clases de `SCL_DESCARTADAS`:
 *      0  sin dato          — el píxel no existe en la escena.
 *      1  saturado/defectuoso — reflectancia no utilizable.
 *      3  sombra de nube    — subestima el NIR y hunde el NDVI.
 *      8  nube, probabilidad media
 *      9  nube, probabilidad alta
 *      10 cirro             — fino, pero altera la relación NIR/rojo.
 *      11 nieve o hielo     — reflectancia alta en NIR, NDVI sin sentido.
 *
 *    Se conservan a propósito, y no por olvido:
 *      2  sombra proyectada — sobre relieve llano (pampa) es marginal, y
 *         descartarla cuesta pasadas enteras en lotes con arboledas al borde.
 *      6  agua              — un lote anegado es información real sobre el
 *         lote, no un artefacto de la escena.
 *      7  no clasificado    — descartarlo enmascararía suelo desnudo y
 *         rastrojo, que son estados legítimos del cultivo.
 *
 * b) El índice no da un número utilizable: `B08 + B04` (o `B08 + B05`) es 0,
 *    o el resultado queda fuera de [-1, 1]. Sin este control un solo píxel
 *    con suma cero emite NaN, y NaN contamina el promedio de TODA la fecha
 *    (Sentinel Hub no lo filtra). `indices.ts` ya se protegía de lo mismo en
 *    TypeScript; acá faltaba.
 *
 * Como Sentinel Hub promedia sólo los píxeles que sobreviven, la proporción
 * de píxeles descartados en cada fecha es la cobertura de nubes/sin-dato
 * SOBRE EL POLÍGONO, no la de la escena completa.
 *
 * `dataMask` como nombre de output tiene significado especial en la
 * Statistical API: enmascara las estadísticas de los demás outputs.
 */

/** Clases SCL que invalidan el píxel. Documentadas una a una arriba. */
export const SCL_DESCARTADAS = [0, 1, 3, 8, 9, 10, 11] as const;

export const EVALSCRIPT_NDVI_NDRE = `
//VERSION=3
var SCL_DESCARTADAS = ${JSON.stringify([...SCL_DESCARTADAS])};

function setup() {
  return {
    input: [{ bands: ["B04", "B05", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "ndre", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1, sampleType: "UINT8" },
    ],
  };
}

/** Índice normalizado con guarda de división por cero y de rango. */
function indiceNormalizado(a, b) {
  var suma = a + b;
  if (suma === 0) return null;
  var valor = (a - b) / suma;
  if (!isFinite(valor) || valor < -1 || valor > 1) return null;
  return valor;
}

function evaluatePixel(sample) {
  var ndvi = indiceNormalizado(sample.B08, sample.B04);
  var ndre = indiceNormalizado(sample.B08, sample.B05);
  // SCL es una banda de clasificación a 20 m remuestreada a 10 m. Se redondea
  // antes de comparar: un valor no entero saldría de la lista de descartadas y
  // un píxel nublado pasaría como limpio, que es el error caro de los dos.
  var descartadaPorSCL = SCL_DESCARTADAS.indexOf(Math.round(sample.SCL)) !== -1;
  var valido =
    sample.dataMask === 1 && !descartadaPorSCL && ndvi !== null && ndre !== null ? 1 : 0;
  return {
    ndvi: [valido ? ndvi : 0],
    ndre: [valido ? ndre : 0],
    dataMask: [valido],
  };
}
`.trim();
