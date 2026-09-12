import { Router } from "express";
import type { ClienteSupabase } from "../lib/supabase.js";
import { rutasAplicaciones } from "./aplicaciones.js";
import { rutasChatUso } from "./chatUso.js";
import { rutasLotes } from "./lotes.js";
import { rutasNotificaciones } from "./notificaciones.js";
import { rutasPlan } from "./plan.js";

/** Monta todas las rutas autenticadas bajo su path base. */
export function montarRutas(supabase: ClienteSupabase): Router {
  const router = Router();
  router.use("/lotes", rutasLotes(supabase));
  router.use("/aplicaciones", rutasAplicaciones(supabase));
  router.use("/plan", rutasPlan(supabase));
  router.use("/chat/uso", rutasChatUso(supabase));
  router.use("/notificaciones", rutasNotificaciones(supabase));
  return router;
}
