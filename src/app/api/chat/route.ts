import { NextResponse } from "next/server";
import { z } from "zod";
import { consultarGroq, GroqNoDisponibleError } from "@/lib/chat/groq";

const EvidenciaSchema = z.object({ etiqueta: z.string(), valor: z.string() });

const HallazgoSchema = z.object({
  categoria: z.enum(["aplicacion", "agua", "clima", "cultivo"]),
  estado: z.enum(["favorable", "atencion", "riesgo", "sin_datos"]),
  titular: z.string(),
  interpretacion: z.string(),
  aEvaluar: z.string().nullable(),
  evidencia: z.array(EvidenciaSchema),
});

const DiagnosticoSchema = z.object({
  estado: z.enum(["favorable", "atencion", "riesgo", "sin_datos"]),
  titular: z.string(),
  principal: z.enum(["aplicacion", "agua", "clima", "cultivo"]).nullable(),
  hallazgos: z.array(HallazgoSchema),
});

const ContextoLoteSchema = z.object({
  lote: z.object({
    nombre: z.string(),
    cultivo: z.string().nullable(),
    areaHa: z.number(),
  }),
  diagnostico: DiagnosticoSchema,
  valorEconomico: z.object({ mensaje: z.string() }).nullable(),
  aplicacionesRecientes: z.array(
    z.object({
      productoNombre: z.string(),
      tipoProducto: z.string(),
      aplicadaEn: z.string(),
      suitability: z.string(),
    }),
  ),
});

const MensajeChatSchema = z.object({
  rol: z.enum(["usuario", "asistente"]),
  texto: z.string(),
});

const BodySchema = z.object({
  mensaje: z.string().min(1).max(500),
  contexto: ContextoLoteSchema,
  historial: z.array(MensajeChatSchema).max(8).default([]),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const { mensaje, contexto, historial } = parsed.data;

  try {
    const respuesta = await consultarGroq(mensaje, contexto, historial);
    return NextResponse.json(respuesta);
  } catch (err) {
    if (err instanceof GroqNoDisponibleError) {
      return NextResponse.json(
        { error: "El asistente no responde en este momento. Reintentá en unos minutos." },
        { status: 503 },
      );
    }
    throw err;
  }
}
