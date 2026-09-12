/**
 * Codificación/decodificación mínima de ERC-20, sin librerías (mismo criterio
 * que `lib/satelital/sentinelhub.ts`: cero dependencias nuevas para hablar
 * con un servicio externo — acá, un nodo RPC de Base en vez de una API REST).
 *
 * Los selectores de función y el topic de evento son constantes universales
 * del estándar ERC-20 (primeros 4 bytes / hash completo de Keccak-256 de la
 * firma), no algo específico de Twin Finance. Se verificaron calculando el
 * hash real antes de escribir este archivo, no de memoria:
 *
 *   transfer(address,uint256)          → 0xa9059cbb
 *   decimals()                         → 0x313ce567
 *   balanceOf(address)                 → 0x70a08231
 *   Transfer(address,address,uint256)  → 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 */

export const SELECTOR_TRANSFER = "0xa9059cbb";
export const SELECTOR_DECIMALS = "0x313ce567";
export const SELECTOR_BALANCE_OF = "0x70a08231";
export const TOPIC_TRANSFER =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/** Palabra EVM de 32 bytes (64 hex) para un `uint256` o una dirección. */
function palabra32(hex: string): string {
  return hex.replace(/^0x/, "").padStart(64, "0");
}

function direccionDesdePalabra(palabra: string): `0x${string}` {
  return `0x${palabra.slice(-40)}`;
}

/** `transfer(address,uint256)` — calldata lista para `eth_sendTransaction`. */
export function codificarTransfer(destino: `0x${string}`, montoMenorUnidad: bigint): `0x${string}` {
  const direccion = palabra32(destino.replace(/^0x/, ""));
  const monto = palabra32(montoMenorUnidad.toString(16));
  return `${SELECTOR_TRANSFER}${direccion}${monto}` as `0x${string}`;
}

/** Convierte un monto humano ("1.5") a la menor unidad del token según sus decimales. */
export function aMenorUnidad(montoHumano: string, decimales: number): bigint {
  const limpio = montoHumano.trim();
  if (!/^\d+(\.\d+)?$/.test(limpio)) {
    throw new RangeError(`Monto inválido: "${montoHumano}"`);
  }
  const [entero, decimal = ""] = limpio.split(".");
  const decimalCompletado = (decimal + "0".repeat(decimales)).slice(0, decimales);
  return BigInt(entero + decimalCompletado || "0");
}

/** Convierte la menor unidad a un texto legible con los decimales del token. */
export function aMontoLegible(montoMenorUnidad: bigint, decimales: number): string {
  const texto = montoMenorUnidad.toString().padStart(decimales + 1, "0");
  const punto = texto.length - decimales;
  const entero = texto.slice(0, punto).replace(/^0+(?=\d)/, "");
  const decimal = texto.slice(punto).replace(/0+$/, "");
  return decimal ? `${entero}.${decimal}` : entero;
}

/**
 * Decodifica el primer log `Transfer` cuyo emisor sea `contratoEsperado`.
 * Devuelve `null` si no aparece: la transacción no movió ese token.
 */
export function decodificarTransferLog(
  logs: readonly { address: string; topics: readonly string[]; data: string }[],
  contratoEsperado: `0x${string}`,
): { desde: `0x${string}`; hacia: `0x${string}`; monto: bigint } | null {
  const log = logs.find(
    (l) =>
      l.address.toLowerCase() === contratoEsperado.toLowerCase() &&
      l.topics[0]?.toLowerCase() === TOPIC_TRANSFER &&
      l.topics.length >= 3,
  );
  if (!log) return null;

  return {
    desde: direccionDesdePalabra(log.topics[1]),
    hacia: direccionDesdePalabra(log.topics[2]),
    monto: BigInt(log.data === "0x" ? "0x0" : log.data),
  };
}
