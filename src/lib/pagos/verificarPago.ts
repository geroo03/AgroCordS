/**
 * Verificación server-side de un pago en stablecoin de Twin Finance.
 *
 * Único lugar que decide si un pago "pasó": nunca se confía en que el
 * navegador diga que la transacción se envió, se lee el recibo real desde el
 * RPC de Base. Mismo rol que `sentinelhub.ts` cumple para el clima: frontera
 * única con la red, aislada para poder cambiar de proveedor (otra red EVM,
 * otro RPC) sin tocar la API route ni la UI.
 */

import { direccionDestino, direccionToken, rpcUrl, redConfigurada, explorerTx } from "./config";
import { aMenorUnidad, aMontoLegible, decodificarTransferLog, SELECTOR_DECIMALS } from "./erc20";
import { obtenerRecibo, llamarView } from "./rpc";
import type { ComprobantePago, EstadoVerificacion, SimboloStablecoin } from "./tipos";

const HASH_TX_REGEX = /^0x[0-9a-fA-F]{64}$/;
const DECIMALES_POR_DEFECTO = 18;

function comprobante(
  estado: EstadoVerificacion,
  mensaje: string,
  extra: Partial<ComprobantePago> = {},
): ComprobantePago {
  return {
    estado,
    hash: null,
    moneda: null,
    monto: null,
    desde: null,
    hacia: null,
    bloque: null,
    red: redConfigurada(),
    explorerUrl: null,
    mensaje,
    ...extra,
  };
}

export interface ParametrosVerificarPago {
  readonly hash: string;
  readonly moneda: SimboloStablecoin;
  /** Monto mínimo esperado, en unidades humanas del token (ej. "1"). */
  readonly montoMinimo: string;
}

export async function verificarPago(params: ParametrosVerificarPago): Promise<ComprobantePago> {
  if (!HASH_TX_REGEX.test(params.hash)) {
    return comprobante("hash_invalido", "El hash de transacción no tiene un formato válido.");
  }

  const contrato = direccionToken(params.moneda);
  const destino = direccionDestino();
  if (!contrato || !destino) {
    return comprobante(
      "no_configurado",
      "Los pagos onchain no están configurados en este entorno.",
    );
  }

  const url = rpcUrl();
  let recibo;
  try {
    recibo = await obtenerRecibo(url, params.hash);
  } catch (err) {
    console.error("[pagos] error_red al obtener el recibo:", err);
    return comprobante("error_red", "No pudimos consultar la red Base en este momento.");
  }

  if (!recibo) {
    return comprobante(
      "no_encontrado",
      "Todavía no encontramos esa transacción en la red. Si acabás de enviarla, esperá unos segundos y reintentá.",
    );
  }

  if (recibo.status !== "0x1") {
    return comprobante("transaccion_fallida", "La transacción se revirtió en la red.", {
      hash: params.hash as `0x${string}`,
      bloque: Number.parseInt(recibo.blockNumber, 16),
      explorerUrl: explorerTx(params.hash),
    });
  }

  const transferencia = decodificarTransferLog(recibo.logs, contrato);
  if (!transferencia) {
    return comprobante(
      "token_incorrecto",
      `La transacción no incluye una transferencia del token ${params.moneda} configurado.`,
      { hash: params.hash as `0x${string}`, explorerUrl: explorerTx(params.hash) },
    );
  }

  if (transferencia.hacia.toLowerCase() !== destino.toLowerCase()) {
    return comprobante(
      "destino_incorrecto",
      "La transferencia no fue enviada a la wallet de destino configurada.",
      { hash: params.hash as `0x${string}`, explorerUrl: explorerTx(params.hash) },
    );
  }

  let decimales = DECIMALES_POR_DEFECTO;
  try {
    const hex = await llamarView(url, contrato, SELECTOR_DECIMALS);
    decimales = Number.parseInt(hex, 16);
    if (!Number.isFinite(decimales) || decimales <= 0 || decimales > 36) {
      decimales = DECIMALES_POR_DEFECTO;
    }
  } catch (err) {
    // No es fatal: seguimos con el valor por defecto y lo dejamos en el log.
    console.error("[pagos] no se pudo leer decimals(), se usa el valor por defecto:", err);
  }

  const montoLegible = aMontoLegible(transferencia.monto, decimales);
  const minimoMenorUnidad = intentar(() => aMenorUnidad(params.montoMinimo, decimales));
  if (minimoMenorUnidad !== null && transferencia.monto < minimoMenorUnidad) {
    return comprobante(
      "monto_insuficiente",
      `El pago fue por ${montoLegible} ${params.moneda}, menos de lo requerido.`,
      {
        hash: params.hash as `0x${string}`,
        moneda: params.moneda,
        monto: montoLegible,
        desde: transferencia.desde,
        hacia: transferencia.hacia,
        bloque: Number.parseInt(recibo.blockNumber, 16),
        explorerUrl: explorerTx(params.hash),
      },
    );
  }

  return comprobante("verificado", `Pago de ${montoLegible} ${params.moneda} verificado onchain.`, {
    hash: params.hash as `0x${string}`,
    moneda: params.moneda,
    monto: montoLegible,
    desde: transferencia.desde,
    hacia: transferencia.hacia,
    bloque: Number.parseInt(recibo.blockNumber, 16),
    explorerUrl: explorerTx(params.hash),
  });
}

function intentar<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}
