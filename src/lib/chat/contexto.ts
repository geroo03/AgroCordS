/**
 * Arma el contexto que el chatbot manda a Groq, a partir de datos que la
 * pantalla de decisión YA calculó — nunca vuelve a consultar clima, satélite
 * ni balance hídrico. Funciones puras, sin I/O: se pueden testear sin red.
 *
 * `construirContextoLote` arma el objeto estructurado (lo que queda en
 * `ContextoLote`); `contextoATexto` lo aplana a un bloque de texto compacto,
 * la forma en la que efectivamente viaja al modelo — separado para poder
 * testear cada paso por separado y para no atar el prompt exacto a la forma
 * interna del tipo.
 */

import type { ValorDecision } from "../riesgo";
import type { Diagnostico } from "../sintesis";
import type { Aplicacion } from "../tipos";
import type { AplicacionResumen, ContextoLote } from "./tipos";

/** Cuántas aplicaciones recientes entran al contexto: alcanza para dar patrón sin inflar tokens. */
const MAX_APLICACIONES_CONTEXTO = 5;

export function construirContextoLote(
  lote: { readonly nombre: string; readonly cultivo: string | null; readonly areaHa: number },
  diagnostico: Diagnostico,
  valor: ValorDecision | null,
  aplicaciones: readonly Aplicacion[],
): ContextoLote {
  return {
    lote: { nombre: lote.nombre, cultivo: lote.cultivo, areaHa: lote.areaHa },
    diagnostico,
    valorEconomico: valor ? { mensaje: valor.mensaje } : null,
    aplicacionesRecientes: aplicaciones
      .slice(0, MAX_APLICACIONES_CONTEXTO)
      .map(aResumen),
  };
}

function aResumen(a: Aplicacion): AplicacionResumen {
  return {
    productoNombre: a.productoNombre,
    tipoProducto: a.tipoProducto,
    aplicadaEn: a.aplicadaEn,
    suitability: a.condiciones.suitability,
  };
}

/**
 * Aplana el contexto a texto plano en español, en el orden en que un
 * productor lo leería: primero el lote, después el diagnóstico (del más
 * severo al menos severo, ya viene ordenado así desde `sintetizar`), después
 * el valor económico y el historial. Nunca incluye un campo que no esté
 * presente — un hallazgo `sin_datos` se informa como tal, no se omite ni se
 * completa con un supuesto.
 */
export function contextoATexto(contexto: ContextoLote): string {
  const { lote, diagnostico, valorEconomico, aplicacionesRecientes } = contexto;
  const partes: string[] = [];

  partes.push(
    `Lote: ${lote.nombre}. Cultivo: ${lote.cultivo ?? "no declarado"}. Superficie: ${lote.areaHa} ha.`,
  );

  partes.push(`Diagnóstico general: ${diagnostico.titular} (estado: ${diagnostico.estado}).`);

  for (const h of diagnostico.hallazgos) {
    const lineas = [`[${h.categoria}] ${h.titular} — estado: ${h.estado}.`, h.interpretacion];
    if (h.aEvaluar) lineas.push(`A evaluar: ${h.aEvaluar}`);
    if (h.evidencia.length > 0) {
      lineas.push(
        `Evidencia: ${h.evidencia.map((e) => `${e.etiqueta} ${e.valor}`).join("; ")}.`,
      );
    }
    partes.push(lineas.join(" "));
  }

  if (valorEconomico) {
    partes.push(`Valor económico de la decisión: ${valorEconomico.mensaje}`);
  }

  if (aplicacionesRecientes.length > 0) {
    const historial = aplicacionesRecientes
      .map((a) => `${a.aplicadaEn.slice(0, 10)}: ${a.productoNombre} (${a.tipoProducto}, condiciones ${a.suitability})`)
      .join("; ");
    partes.push(`Últimas aplicaciones registradas: ${historial}.`);
  } else {
    partes.push("No hay aplicaciones registradas todavía en este lote.");
  }

  return partes.join("\n");
}
