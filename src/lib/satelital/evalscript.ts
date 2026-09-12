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
 * Nubes sobre el lote: el píxel se descarta (dataMask final = 0) cuando SCL
 * lo clasifica como sombra de nube (3), nube de probabilidad media (8) o
 * alta (9), o cirro (10). Así Sentinel Hub promedia sólo píxeles limpios, y
 * la proporción de píxeles descartados en cada fecha es la cobertura de
 * nubes/sin-dato SOBRE EL POLÍGONO, no la de la escena completa.
 *
 * `dataMask` como nombre de output tiene significado especial en la
 * Statistical API: enmascara las estadísticas de los demás outputs.
 */
export const EVALSCRIPT_NDVI_NDRE = `
//VERSION=3
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

function evaluatePixel(sample) {
  var ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  var ndre = (sample.B08 - sample.B05) / (sample.B08 + sample.B05);
  // SCL: 3 sombra de nube, 8/9 nube media/alta probabilidad, 10 cirro.
  var nuboso = sample.SCL === 3 || sample.SCL === 8 || sample.SCL === 9 || sample.SCL === 10;
  var valido = sample.dataMask === 1 && !nuboso ? 1 : 0;
  return {
    ndvi: [valido ? ndvi : 0],
    ndre: [valido ? ndre : 0],
    dataMask: [valido],
  };
}
`.trim();
