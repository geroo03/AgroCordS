/**
 * Aplicaciones registradas. Espejo de listarTodasLasAplicaciones/
 * guardarAplicacion en src/lib/almacen.ts, sobre la tabla `aplicaciones`.
 */

import { Router } from "express";
import { z } from "zod";
import { ErrorNoEncontrado, ErrorSupabase } from "../errores.js";
import type { ClienteSupabase } from "../lib/supabase.js";
import type { Aplicacion, FilaAplicacion } from "../tipos.js";

const NuevaAplicacionSchema = z.object({
  loteId: z.string().uuid(),
  productoNombre: z.string().min(1).max(120),
  tipoProducto: z.enum(["sistemico", "contacto"]),
  // El HourAssessment congelado: se guarda tal cual, no se re-valida su forma
  // interna en detalle (es un snapshot de cumplimiento, no un dato que este
  // backend interprete).
  condiciones: z.unknown(),
  notas: z.string().max(500).nullable().default(null),
});

export function aAplicacion(fila: FilaAplicacion): Aplicacion {
  return {
    id: fila.id,
    loteId: fila.lote_id,
    productoNombre: fila.producto_nombre,
    tipoProducto: fila.tipo_producto,
    aplicadaEn: fila.aplicada_en,
    condiciones: fila.condiciones,
    notas: fila.notas,
  };
}

export function rutasAplicaciones(supabase: ClienteSupabase): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    const { data, error } = await supabase
      .from("aplicaciones")
      .select("*")
      .eq("user_id", req.userId as string)
      .order("aplicada_en", { ascending: false });

    if (error) return next(new ErrorSupabase("No se pudieron listar las aplicaciones.", error));
    res.json((data as FilaAplicacion[]).map(aAplicacion));
  });

  router.post("/", async (req, res, next) => {
    const parsed = NuevaAplicacionSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);

    // El lote tiene que ser del usuario: si no, cualquiera podría colgar una
    // aplicación de un lote ajeno adivinando su id.
    const lote = await supabase
      .from("lotes")
      .select("id")
      .eq("user_id", req.userId as string)
      .eq("id", parsed.data.loteId)
      .maybeSingle();
    if (lote.error) return next(new ErrorSupabase("No se pudo verificar el lote.", lote.error));
    if (!lote.data) return next(new ErrorNoEncontrado("Este lote no existe."));

    const { data, error } = await supabase
      .from("aplicaciones")
      .insert({
        user_id: req.userId as string,
        lote_id: parsed.data.loteId,
        producto_nombre: parsed.data.productoNombre,
        tipo_producto: parsed.data.tipoProducto,
        condiciones: parsed.data.condiciones,
        notas: parsed.data.notas,
      })
      .select("*")
      .single();

    if (error) return next(new ErrorSupabase("No se pudo registrar la aplicación.", error));
    res.status(201).json(aAplicacion(data as FilaAplicacion));
  });

  return router;
}
