/**
 * Tipos del módulo de pagos onchain (stablecoins de Twin Finance).
 *
 * Independiente de React, igual que `lib/satelital/tipos.ts`. Un pago
 * verificado es un dato más para desbloquear Premium — no toca `plan.ts`
 * más que para llamar a `activarPremium()` una vez confirmado, ni al motor
 * de pulverización en absoluto.
 */

/** Símbolos soportados hoy. Agregar uno nuevo es una línea en `config.ts`. */
export type SimboloStablecoin = "ARGt" | "BRAt";

export type RedPagos = "base" | "base-sepolia";

export type EstadoVerificacion =
  | "verificado"
  | "no_configurado"
  | "hash_invalido"
  | "no_encontrado"
  | "transaccion_fallida"
  | "token_incorrecto"
  | "destino_incorrecto"
  | "monto_insuficiente"
  | "error_red";

/**
 * Resultado de verificar una transacción onchain contra el RPC público de
 * Base. Nunca se construye a mano con `estado: "verificado"`: sólo lo
 * produce `verificarPago` después de leer el recibo real de la red.
 */
export interface ComprobantePago {
  readonly estado: EstadoVerificacion;
  readonly hash: `0x${string}` | null;
  readonly moneda: SimboloStablecoin | null;
  /** Monto formateado con los decimales reales del token (leídos onchain). */
  readonly monto: string | null;
  readonly desde: `0x${string}` | null;
  readonly hacia: `0x${string}` | null;
  readonly bloque: number | null;
  readonly red: RedPagos;
  /** Link directo al explorer para que el jurado lo verifique por sí mismo. */
  readonly explorerUrl: string | null;
  /** Detalle apto para mostrar al usuario; nunca un stack trace. */
  readonly mensaje: string;
}

export class ErrorPagos extends Error {
  constructor(
    readonly codigo: EstadoVerificacion,
    message: string,
    readonly causa?: unknown,
  ) {
    super(message);
    this.name = "ErrorPagos";
  }
}
