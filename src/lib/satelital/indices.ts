/**
 * Fórmulas de los índices sobre bandas de Sentinel-2 L2A.
 *
 * El cálculo real ocurre por píxel dentro del evalscript de la Statistical
 * API (ver `evalscript.ts`): Sentinel Hub calcula el índice en cada píxel y
 * después promedia sobre el polígono, que es más correcto que promediar las
 * bandas y dividir (la razón de promedios no es el promedio de las razones).
 *
 * Estas funciones documentan la misma fórmula en TypeScript, verificable por
 * test, y quedan disponibles si en el futuro hiciera falta calcular el índice
 * a partir de reflectancias de banda ya agregadas. Si se cambia una fórmula,
 * cambiar también la del evalscript.
 */

/**
 * NDVI = (B08 − B04) / (B08 + B04)
 * B08 = NIR (~842 nm, 10 m) · B04 = Red (~665 nm, 10 m)
 */
export function calcularNdvi(b08: number, b04: number): number {
  const suma = b08 + b04;
  return suma === 0 ? 0 : (b08 - b04) / suma;
}

/**
 * NDRE = (B08 − B05) / (B08 + B05)
 * B08 = NIR (~842 nm, 10 m) · B05 = Red Edge 1 (~705 nm, 20 m)
 * Variante para Sentinel-2: usa la primera banda de borde rojo.
 */
export function calcularNdre(b08: number, b05: number): number {
  const suma = b08 + b05;
  return suma === 0 ? 0 : (b08 - b05) / suma;
}
