/**
 * Notificaciones ya enviadas (deduplicación). Espejo de la clave
 * ventana.notificadas.v1 en src/lib/notificaciones.ts, sobre la tabla
 * `notificaciones_enviadas`.
 */

import { Router } from "express";
import { z } from "zod";
import { ErrorSupabase } from "../errores.js";
import type { ClienteSupabase } from "../lib/supabase.js";
import type { FilaNotificacionEnviada, NotificacionEnviada } from "../tipos.js";

const CODIGO_UNIQUE_VIOLATION = "23505";

const NuevaNotificacionSchema = z.object({
  loteId: z.string().uuid(),
  // ISO local del lote, en texto — nunca se reinterpreta como timestamptz
  // (misma convención que HourAssessment.time en la app Next.js).
  ventanaInicio: z.string().min(1),
});

function aNotificacion(fila: FilaNotificacionEnviada): NotificacionEnviada {
  return { loteId: fila.lote_id, ventanaInicio: fila.ventana_inicio };
}

export function rutasNotificaciones(supabase: ClienteSupabase): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    const { data, error } = await supabase
      .from("notificaciones_enviadas")
      .select("*")
      .eq("user_id", req.userId as string);

    if (error) return next(new ErrorSupabase("No se pudieron listar las notificaciones.", error));
    res.json((data as FilaNotificacionEnviada[]).map(aNotificacion));
  });

  router.post("/", async (req, res, next) => {
    const parsed = NuevaNotificacionSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);

    const { data, error } = await supabase
      .from("notificaciones_enviadas")
      .insert({
        user_id: req.userId as string,
        lote_id: parsed.data.loteId,
        ventana_inicio: parsed.data.ventanaInicio,
      })
      .select("*")
      .single();

    if (error) {
      // Ya se había registrado esta ventana: insertarla de nuevo no es un
      // fallo, es exactamente lo que la deduplicación busca evitar avisar
      // dos veces — se responde éxito igual, sin la fila duplicada.
      if (error.code === CODIGO_UNIQUE_VIOLATION) {
        res.status(200).json({ loteId: parsed.data.loteId, ventanaInicio: parsed.data.ventanaInicio });
        return;
      }
      return next(new ErrorSupabase("No se pudo registrar la notificación.", error));
    }
    res.status(201).json(aNotificacion(data as FilaNotificacionEnviada));
  });

  return router;
}
