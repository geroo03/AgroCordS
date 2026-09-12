/**
 * Única frontera con @supabase/supabase-js — mismo criterio que
 * src/lib/openmeteo.ts o src/lib/chat/groq.ts en la app Next.js: ninguna otra
 * parte de este backend importa el SDK directo, todas reciben el cliente ya
 * armado. Cambiar de proveedor (u otra versión del SDK) toca sólo este
 * archivo.
 *
 * Es una FACTORY, no un singleton importado: cada ruta y cada test reciben
 * el cliente por parámetro (inyección de dependencias simple), así los tests
 * pueden pasar un cliente falso sin mockear el módulo completo del SDK.
 *
 * Usa la SERVICE ROLE KEY a propósito: este backend ya verificó el JWT del
 * usuario en el middleware de auth y filtra manualmente por user_id en cada
 * consulta — Row Level Security queda como respaldo de defensa en
 * profundidad (por si algún día algo habla directo con Supabase), no como el
 * mecanismo principal acá.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Config } from "../config.js";

export type ClienteSupabase = SupabaseClient;

export function crearClienteSupabase(config: Pick<Config, "supabaseUrl" | "supabaseServiceRoleKey">): ClienteSupabase {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      // Este cliente vive en el servidor y usa la service role key: no
      // necesita persistir sesión propia ni refrescar tokens automáticamente.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
