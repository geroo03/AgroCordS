import { NextResponse } from "next/server";
import { z } from "zod";
import { verificarPago } from "@/lib/pagos";
import { montoDemo } from "@/lib/pagos/config";

const CuerpoSchema = z.object({
  hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Hash de transacción inválido"),
  moneda: z.enum(["ARGt", "BRAt"]),
});

/**
 * POST /api/pagos/verificar { hash, moneda }
 *
 * Verifica contra el RPC de Base que `hash` sea una transferencia real y
 * confirmada del token indicado hacia la wallet de destino configurada.
 * Nunca confía en el body para el resultado — sólo lo usa para saber QUÉ
 * mirar en la cadena.
 */
export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const parsed = CuerpoSchema.safeParse(cuerpo);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parámetros inválidos" },
      { status: 400 },
    );
  }

  const comprobante = await verificarPago({
    hash: parsed.data.hash,
    moneda: parsed.data.moneda,
    montoMinimo: montoDemo(),
  });

  return NextResponse.json(comprobante);
}
