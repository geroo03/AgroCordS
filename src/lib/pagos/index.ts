/**
 * Punto de entrada del módulo de pagos onchain.
 *
 * `verificarPago` es lo único que la API route importa. El flujo completo:
 *
 *   Wallet del usuario (MetaMask, vía `wallet.ts`, sólo cliente)
 *     → firma y envía `transfer(destino, monto)` en el token elegido
 *       → el hash de esa transacción se manda a POST /api/pagos/verificar
 *         → `verificarPago` lee el recibo REAL desde el RPC de Base
 *           → ComprobantePago
 *
 * Ningún paso simula una respuesta: sin `NEXT_PUBLIC_ARGT_CONTRATO` /
 * `NEXT_PUBLIC_PAGOS_DESTINO` configurados, `pagosConfigurados()` es `false`
 * y la UI no ofrece pagar onchain — sólo queda la activación de demo de
 * `Paywall.tsx`, que ya existía y sigue intacta.
 *
 * Cambiar de red o de proveedor de RPC es tocar `config.ts` y `rpc.ts`;
 * `tipos.ts`, la API route y la UI quedan igual.
 */

export { verificarPago } from "./verificarPago";
export type { ParametrosVerificarPago } from "./verificarPago";
export {
  pagosConfigurados,
  tokensDisponibles,
  direccionToken,
  direccionDestino,
  redConfigurada,
  montoDemo,
  REDES,
} from "./config";
export type {
  ComprobantePago,
  EstadoVerificacion,
  SimboloStablecoin,
  RedPagos,
} from "./tipos";
