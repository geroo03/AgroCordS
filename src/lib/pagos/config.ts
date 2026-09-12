/**
 * Configuración de la integración de pagos con stablecoins de Twin Finance
 * (ARGt, BRAt) sobre Base.
 *
 * A diferencia de `lib/satelital/config.ts`, estas variables SÍ son
 * `NEXT_PUBLIC_*` a propósito: una dirección de contrato o de wallet de
 * destino es información pública (cualquiera puede verla en BaseScan), no un
 * secreto — y el navegador la necesita para armar la transacción que la
 * wallet del usuario va a firmar. Ningún secreto real (clave privada,
 * seed) pasa nunca por esta app: quien firma es la wallet del usuario
 * (MetaMask u otra), nunca el servidor.
 */

import type { RedPagos, SimboloStablecoin } from "./tipos";

/** Datos de red públicos y documentados por Base (docs.base.org/chainlist.org). */
export const REDES: Record<
  RedPagos,
  { chainId: number; chainIdHex: `0x${string}`; nombre: string; rpcPorDefecto: string; explorer: string }
> = {
  base: {
    chainId: 8453,
    chainIdHex: "0x2105",
    nombre: "Base",
    rpcPorDefecto: "https://mainnet.base.org",
    explorer: "https://basescan.org",
  },
  "base-sepolia": {
    chainId: 84532,
    chainIdHex: "0x14a34",
    nombre: "Base Sepolia (testnet)",
    rpcPorDefecto: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
  },
};

/**
 * Monto de demostración por defecto (en unidades del token, no en la menor
 * unidad): una interacción onchain real no necesita mover un monto grande
 * para ser real. Configurable; no es un precio de producción calibrado,
 * mismo criterio que `COSTO_PROMEDIO_HA_ARS` en `lib/riesgo.ts`.
 */
export const MONTO_DEMO_POR_DEFECTO = "1";

function limpiar(valor: string | undefined): string | null {
  const v = valor?.trim();
  return v ? v : null;
}

function comoDireccion(valor: string | null): `0x${string}` | null {
  if (!valor) return null;
  return /^0x[0-9a-fA-F]{40}$/.test(valor) ? (valor as `0x${string}`) : null;
}

export function redConfigurada(): RedPagos {
  const valor = limpiar(process.env.NEXT_PUBLIC_PAGOS_RED);
  return valor === "base-sepolia" ? "base-sepolia" : "base";
}

export function rpcUrl(): string {
  return limpiar(process.env.PAGOS_RPC_URL) ?? REDES[redConfigurada()].rpcPorDefecto;
}

/** Wallet de destino de la demo (tesorería). `null` si no está configurada. */
export function direccionDestino(): `0x${string}` | null {
  return comoDireccion(limpiar(process.env.NEXT_PUBLIC_PAGOS_DESTINO));
}

/**
 * Lee `process.env` en cada llamada, no en la carga del módulo: capturarlo
 * una sola vez en un objeto de módulo se rompe en cualquier entorno que no
 * sea el bundler de Next.js reemplazando `NEXT_PUBLIC_*` en tiempo de build
 * (por ejemplo, los tests con Vitest, que sí leen `process.env` en runtime).
 */
export function direccionToken(simbolo: SimboloStablecoin): `0x${string}` | null {
  const variable =
    simbolo === "ARGt"
      ? process.env.NEXT_PUBLIC_ARGT_CONTRATO
      : process.env.NEXT_PUBLIC_BRAT_CONTRATO;
  return comoDireccion(limpiar(variable));
}

/** Símbolos que tienen contrato configurado en este entorno. */
export function tokensDisponibles(): SimboloStablecoin[] {
  return (["ARGt", "BRAt"] as const).filter((s) => direccionToken(s) !== null);
}

/** La integración completa (red + destino + al menos un token) está lista. */
export function pagosConfigurados(): boolean {
  return direccionDestino() !== null && tokensDisponibles().length > 0;
}

export function montoDemo(): string {
  return limpiar(process.env.NEXT_PUBLIC_PAGOS_MONTO_DEMO) ?? MONTO_DEMO_POR_DEFECTO;
}

export function explorerTx(hash: string): string {
  return `${REDES[redConfigurada()].explorer}/tx/${hash}`;
}
