/**
 * Uso diario del chatbot. Espejo de src/lib/chat/limite.ts, sobre la tabla
 * `uso_chat_diario` — el límite de 5 consultas/día pasa de ser por
 * dispositivo (localStorage) a ser por cuenta.
 *
 * Lectura-y-escritura simple para incrementar, no un UPDATE atómico vía RPC:
 * en el peor caso (dos requests concurrentes) alguien gana una consulta
 * gratis de más un día — no es un problema de seguridad, y mantenerlo simple
 * pesa más que blindarlo para un límite de demo.
 */

import { Router } from "express";
import { ErrorSupabase } from "../errores.js";
import type { ClienteSupabase } from "../lib/supabase.js";
import type { FilaUsoChatDiario, UsoChatDiario } from "../tipos.js";

/** Misma convención que hoyIso() en chat/limite.ts: fecha civil en UTC. */
function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function aUso(fila: FilaUsoChatDiario | null, fecha: string): UsoChatDiario {
  return { fecha, consultas: fila?.consultas ?? 0 };
}

export function rutasChatUso(supabase: ClienteSupabase): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    const fecha = hoyIso();
    const { data, error } = await supabase
      .from("uso_chat_diario")
      .select("*")
      .eq("user_id", req.userId as string)
      .eq("fecha", fecha)
      .maybeSingle();

    if (error) return next(new ErrorSupabase("No se pudo obtener el uso del chat.", error));
    res.json(aUso(data as FilaUsoChatDiario | null, fecha));
  });

  router.post("/", async (req, res, next) => {
    const userId = req.userId as string;
    const fecha = hoyIso();

    const actual = await supabase
      .from("uso_chat_diario")
      .select("consultas")
      .eq("user_id", userId)
      .eq("fecha", fecha)
      .maybeSingle();
    if (actual.error) return next(new ErrorSupabase("No se pudo leer el uso del chat.", actual.error));

    const consultas = (actual.data?.consultas ?? 0) + 1;
    const { data, error } = await supabase
      .from("uso_chat_diario")
      .upsert({ user_id: userId, fecha, consultas }, { onConflict: "user_id,fecha" })
      .select("*")
      .single();

    if (error) return next(new ErrorSupabase("No se pudo registrar la consulta.", error));
    res.status(201).json(aUso(data as FilaUsoChatDiario, fecha));
  });

  return router;
}
