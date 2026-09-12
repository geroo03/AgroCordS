/**
 * Tipos del asistente conversacional (chatbot) por lote.
 *
 * El chatbot NO recalcula agronomía: lee el `Diagnostico` que ya produce
 * `sintesis.ts` (la misma síntesis que ve el usuario en pantalla, en
 * `<Diagnostico/>`) y lo usa como contexto para responder en lenguaje
 * natural, con foco en las acciones que `sintesis.ts` ya identificó como
 * "a evaluar". Esto evita dos fuentes de verdad: si el diagnóstico en
 * pantalla dice una cosa, el chat nunca puede decir otra.
 */

import type { Diagnostico } from "../sintesis";

export interface MensajeChat {
  readonly rol: "usuario" | "asistente";
  readonly texto: string;
}

/** Proyección chica de una aplicación registrada: sólo lo que le sirve al chat. */
export interface AplicacionResumen {
  readonly productoNombre: string;
  readonly tipoProducto: string;
  /** ISO UTC. */
  readonly aplicadaEn: string;
  readonly suitability: string;
}

export interface ContextoLote {
  readonly lote: {
    readonly nombre: string;
    readonly cultivo: string | null;
    readonly areaHa: number;
  };
  readonly diagnostico: Diagnostico;
  /** `null` cuando no hay una decisión económica relevante o no hay pronóstico. */
  readonly valorEconomico: { readonly mensaje: string } | null;
  /** Las más recientes primero, ya recortadas a un puñado. */
  readonly aplicacionesRecientes: readonly AplicacionResumen[];
}

export interface RespuestaChat {
  readonly respuesta: string;
  /** Frases cortas, imperativas y accionables. Puede venir vacío. */
  readonly acciones: readonly string[];
}
