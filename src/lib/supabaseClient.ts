/**
 * Única frontera con Supabase Auth del lado del navegador — mismo criterio
 * que openmeteo.ts o chat/groq.ts: ninguna otra parte de la app importa el
 * SDK directo.
 *
 * Sin `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas
 * (por ejemplo, en un fork sin Supabase todavía), `obtenerSupabase()` y
 * `obtenerSesionActual()` devuelven `null` en vez de romper: el resto de la
 * app (almacen.ts, plan.ts, chat/limite.ts) ya sabe leer eso como "modo
 * local, seguir con localStorage" — la ausencia de sesión es exactamente el
 * mismo camino que "no hay backend configurado".
 */

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null | undefined;

export function obtenerSupabase(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cliente = url && anonKey ? createClient(url, anonKey) : null;
  return cliente;
}

/** `null` si no hay Supabase configurado o si nadie inició sesión (modo local). */
export async function obtenerSesionActual(): Promise<Session | null> {
  const supabase = obtenerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function cerrarSesionSupabase(): Promise<void> {
  const supabase = obtenerSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
