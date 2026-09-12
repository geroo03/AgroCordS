/**
 * Cliente de Groq (chat completions, API compatible con OpenAI).
 *
 * Única frontera con el proveedor: acá se arma el prompt, se valida la
 * respuesta y se traduce a `RespuestaChat`. Ninguna otra parte de la app
 * conoce la forma de la respuesta de Groq — cambiar de proveedor de LLM
 * toca sólo este archivo, mismo criterio que `openmeteo.ts` y
 * `satelital/index.ts`.
 *
 * Sin SDK nueva: un `fetch` crudo alcanza (API HTTP simple, sin streaming
 * acá), igual que `pagos/rpc.ts` evita `ethers`/`viem`.
 */

import { z } from "zod";
import { contextoATexto } from "./contexto";
import type { ContextoLote, MensajeChat, RespuestaChat } from "./tipos";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELO_POR_DEFECTO = "llama-3.3-70b-versatile";
/** Últimos mensajes de la conversación que se reenvían como historial. */
const MAX_HISTORIAL = 8;
const TIMEOUT_MS = 20_000;

export class GroqNoDisponibleError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "GroqNoDisponibleError";
  }
}

const RespuestaGroqSchema = z.object({
  respuesta: z.string(),
  acciones: z.array(z.string()).default([]),
});

const PROMPT_SISTEMA = `Sos el asistente de "Ventana de Aplicación", una app que ayuda a productores agropecuarios argentinos a decidir cuándo pulverizar un lote.

Reglas estrictas:
- Usá SOLO los datos del contexto del lote que te paso a continuación. Nunca inventes números, fechas ni condiciones que no estén ahí. Si el contexto no tiene un dato para responder algo, decilo con honestidad en vez de inventarlo.
- Priorizá dar acciones concretas y accionables por sobre explicaciones largas. Cada acción va como una frase corta, imperativa (ej. "Esperá la ventana de las 6 a 10 h de mañana", "Revisá el riesgo de helada antes de decidir").
- Nunca reemplazás la receta de un ingeniero agrónomo matriculado: describís condiciones y sugerís qué evaluar, nunca instruís qué aplicar, sembrar o regar como si fuera una receta profesional.
- Respondé siempre en español rioplatense, tono directo y cordial, sin tecnicismos innecesarios.
- Respondé SIEMPRE con un JSON exactamente con esta forma, sin texto afuera del JSON: {"respuesta": "...", "acciones": ["...", "..."]}. El array "acciones" puede ir vacío si no hay ninguna acción concreta que sugerir.`;

/**
 * Consulta a Groq con el mensaje del usuario, el contexto del lote y el
 * historial reciente de la conversación (multi-turno, en memoria del
 * cliente — acá sólo se reenvía).
 */
export async function consultarGroq(
  mensaje: string,
  contexto: ContextoLote,
  historial: readonly MensajeChat[],
): Promise<RespuestaChat> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqNoDisponibleError("Falta configurar GROQ_API_KEY en el servidor.");
  }

  const mensajes = [
    { role: "system" as const, content: PROMPT_SISTEMA },
    { role: "system" as const, content: `Contexto actual del lote:\n${contextoATexto(contexto)}` },
    ...historial.slice(-MAX_HISTORIAL).map((m) => ({
      role: m.rol === "usuario" ? ("user" as const) : ("assistant" as const),
      content: m.texto,
    })),
    { role: "user" as const, content: mensaje },
  ];

  let raw: unknown;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? MODELO_POR_DEFECTO,
        messages: mensajes,
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new GroqNoDisponibleError(`Groq respondió ${res.status}`);
    }
    raw = await res.json();
  } catch (err) {
    if (err instanceof GroqNoDisponibleError) throw err;
    throw new GroqNoDisponibleError("No se pudo consultar al asistente.", err);
  }

  const contenido = extraerContenido(raw);
  if (contenido === null) {
    throw new GroqNoDisponibleError("Respuesta de Groq con forma inesperada (sin contenido).");
  }

  let parseado: unknown;
  try {
    parseado = JSON.parse(contenido);
  } catch (err) {
    throw new GroqNoDisponibleError("El asistente no devolvió un JSON válido.", err);
  }

  const validado = RespuestaGroqSchema.safeParse(parseado);
  if (!validado.success) {
    throw new GroqNoDisponibleError(
      `Respuesta del asistente con forma inesperada: ${validado.error.issues[0]?.path.join(".")}`,
    );
  }

  return validado.data;
}

const ChoiceSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

function extraerContenido(raw: unknown): string | null {
  const parsed = ChoiceSchema.safeParse(raw);
  return parsed.success ? parsed.data.choices[0].message.content : null;
}
