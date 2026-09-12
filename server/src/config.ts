/**
 * Configuración del servidor, leída una sola vez al arrancar.
 *
 * Falla rápido y con un mensaje claro si falta algo crítico — mismo criterio
 * de honestidad que el resto del proyecto (nunca un 500 sin explicación
 * cuando el problema es, en realidad, "no está configurado"). No hay
 * fallback de demostración para Supabase: a diferencia de NDVI o el clima,
 * servir datos de otro usuario o inventar una fila sería un error grave, no
 * una degradación aceptable.
 */

import "dotenv/config";

export interface Config {
  readonly puerto: number;
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
  readonly corsOrigin: string;
}

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor || valor.trim().length === 0) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copiá .env.example a .env y completala.`,
    );
  }
  return valor;
}

export function cargarConfig(): Config {
  return {
    puerto: Number(process.env.PORT ?? 4000),
    supabaseUrl: requerida("SUPABASE_URL"),
    supabaseServiceRoleKey: requerida("SUPABASE_SERVICE_ROLE_KEY"),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  };
}
