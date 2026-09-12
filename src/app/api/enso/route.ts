import { NextResponse } from "next/server";
import { EnsoNoDisponibleError, fetchEstadoEnso } from "@/lib/enso";

/**
 * Estado ENSO actual. Va por el servidor como el resto de las fuentes
 * externas: la NOAA publica el ONI una vez por mes, así que una caché larga
 * y compartida evita que cada navegador vuelva a pedir lo mismo.
 *
 * No recibe parámetros: el ONI es un índice global, no depende del lote. Lo
 * que sí depende de la región es su interpretación, y eso vive en la capa de
 * síntesis, no acá.
 */
export const revalidate = 21600; // 6 h

export async function GET() {
  try {
    return NextResponse.json(await fetchEstadoEnso());
  } catch (error) {
    if (error instanceof EnsoNoDisponibleError) {
      // 503: el problema es de un tercero y se resuelve reintentando.
      console.error("[enso] no disponible:", error);
      return NextResponse.json(
        { error: "El índice climático no está disponible en este momento." },
        { status: 503 },
      );
    }
    throw error;
  }
}
