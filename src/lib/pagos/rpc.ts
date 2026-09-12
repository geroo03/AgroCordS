/**
 * Cliente JSON-RPC mínimo contra el nodo de Base. Sólo servidor: la
 * verificación de un pago no debe confiar en lo que el navegador diga que
 * pasó, sino leer el estado real de la cadena.
 *
 * Base es una red pública EVM: leer un recibo de transacción o llamar a una
 * función `view` no requiere autenticación ni clave alguna, a diferencia de
 * Sentinel Hub.
 */

const TIMEOUT_RPC_MS = 10_000;

interface RecursoJsonRpc {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

async function llamarRpc(url: string, metodo: string, params: unknown[]): Promise<unknown> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: metodo, params }),
      signal: AbortSignal.timeout(TIMEOUT_RPC_MS),
      // Un recibo de transacción confirmado no cambia: cachear en el fetch de
      // Next.js es redundante con el cache propio del módulo, se desactiva.
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(`No se pudo contactar el RPC de Base (${metodo}).`, { cause: err });
  }

  if (!respuesta.ok) {
    throw new Error(`El RPC de Base respondió HTTP ${respuesta.status} para ${metodo}.`);
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as RecursoJsonRpc | null;
  if (!cuerpo) throw new Error(`Respuesta RPC inválida para ${metodo}.`);
  if (cuerpo.error) {
    throw new Error(`RPC ${metodo} devolvió error: ${cuerpo.error.message}`);
  }
  return cuerpo.result;
}

export interface ReciboTransaccion {
  status: "0x1" | "0x0";
  blockNumber: string;
  logs: { address: string; topics: string[]; data: string }[];
}

export async function obtenerRecibo(url: string, hash: string): Promise<ReciboTransaccion | null> {
  const resultado = await llamarRpc(url, "eth_getTransactionReceipt", [hash]);
  return (resultado as ReciboTransaccion | null) ?? null;
}

/** Llama a una función `view` sin argumentos adicionales (ej. `decimals()`). */
export async function llamarView(url: string, contrato: string, selector: string): Promise<string> {
  const resultado = await llamarRpc(url, "eth_call", [
    { to: contrato, data: selector },
    "latest",
  ]);
  return typeof resultado === "string" ? resultado : "0x0";
}
