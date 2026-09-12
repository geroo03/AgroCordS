/**
 * Puente con la wallet del navegador (MetaMask u otra compatible con
 * EIP-1193, `window.ethereum`). Sólo se importa desde componentes cliente.
 *
 * Ninguna clave privada ni semilla pasa por esta app en ningún momento: quien
 * firma la transacción es la extensión de wallet del usuario, en su propia
 * UI — esta capa sólo arma la solicitud y lee la respuesta pública (cuenta,
 * hash de transacción).
 */

import { codificarTransfer, SELECTOR_DECIMALS, aMenorUnidad } from "./erc20";
import { REDES } from "./config";
import type { RedPagos } from "./tipos";

interface ProveedorEip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

function proveedor(): ProveedorEip1193 | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: ProveedorEip1193 }).ethereum;
  return eth ?? null;
}

export function hayWalletInyectada(): boolean {
  return proveedor() !== null;
}

export async function conectarWallet(): Promise<`0x${string}`> {
  const eth = proveedor();
  if (!eth) throw new Error("No se detectó una wallet (MetaMask u otra) en este navegador.");
  const cuentas = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  const cuenta = cuentas[0];
  if (!cuenta) throw new Error("La wallet no devolvió ninguna cuenta.");
  return cuenta as `0x${string}`;
}

/** Cambia la wallet a la red configurada; la agrega si todavía no la tiene. */
export async function asegurarRed(red: RedPagos): Promise<void> {
  const eth = proveedor();
  if (!eth) throw new Error("No se detectó una wallet en este navegador.");
  const info = REDES[red];

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: info.chainIdHex }],
    });
  } catch (err) {
    const codigo = (err as { code?: number } | null)?.code;
    if (codigo !== 4902) throw err; // 4902: la wallet no conoce esta red todavía.
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: info.chainIdHex,
          chainName: info.nombre,
          rpcUrls: [info.rpcPorDefecto],
          blockExplorerUrls: [info.explorer],
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        },
      ],
    });
  }
}

async function leerDecimales(contrato: `0x${string}`): Promise<number> {
  const eth = proveedor();
  if (!eth) throw new Error("No se detectó una wallet en este navegador.");
  const hex = (await eth.request({
    method: "eth_call",
    params: [{ to: contrato, data: SELECTOR_DECIMALS }, "latest"],
  })) as string;
  const decimales = Number.parseInt(hex, 16);
  return Number.isFinite(decimales) && decimales > 0 && decimales <= 36 ? decimales : 18;
}

export interface ParametrosEnviarPago {
  readonly contrato: `0x${string}`;
  readonly destino: `0x${string}`;
  readonly desde: `0x${string}`;
  readonly montoHumano: string;
}

/** Arma y envía `transfer(destino, monto)`; devuelve el hash apenas la wallet lo emite. */
export async function enviarPago(params: ParametrosEnviarPago): Promise<`0x${string}`> {
  const eth = proveedor();
  if (!eth) throw new Error("No se detectó una wallet en este navegador.");

  const decimales = await leerDecimales(params.contrato);
  const monto = aMenorUnidad(params.montoHumano, decimales);
  const data = codificarTransfer(params.destino, monto);

  const hash = (await eth.request({
    method: "eth_sendTransaction",
    params: [{ from: params.desde, to: params.contrato, data }],
  })) as string;

  return hash as `0x${string}`;
}
