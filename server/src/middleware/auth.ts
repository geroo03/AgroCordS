/**
 * Verifica el JWT de Supabase Auth en cada request y deja el user_id en
 * `req.userId`. El login (magic link) lo dispara el cliente Next.js directo
 * contra la Auth API de Supabase — este backend nunca manda el mail, sólo
 * confirma que el token que llega es válido y de quién es.
 *
 * Usa `supabase.auth.getUser(token)` (no una verificación local del JWT):
 * es más lento por la ida y vuelta a Supabase, pero es la forma que
 * recomienda Supabase para un backend propio, y de paso confirma que el
 * usuario no fue revocado — una verificación local del secreto no lo sabría.
 */

import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ErrorNoAutorizado } from "../errores.js";
import type { ClienteSupabase } from "../lib/supabase.js";

export function crearVerificarAuth(supabase: ClienteSupabase): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const encabezado = req.header("authorization") ?? req.header("Authorization");
    const token = encabezado?.startsWith("Bearer ") ? encabezado.slice("Bearer ".length).trim() : null;

    if (!token) {
      next(new ErrorNoAutorizado("Falta el token de autenticación."));
      return;
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      next(new ErrorNoAutorizado("Token de autenticación inválido o vencido."));
      return;
    }

    req.userId = data.user.id;
    next();
  };
}
