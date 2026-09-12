/**
 * Plan del usuario (gratis/premium). Espejo de plan.ts en la app Next.js,
 * sobre la tabla `plan_usuario`.
 *
 * Decisión de diseño: la fila no existe hasta el primer request — GET /plan
 * la crea con upsert (plan por defecto 'gratis', vía default de la columna)
 * si todavía no está, así nunca hay un 404 en el flujo normal ni un objeto
 * inventado que no esté realmente en la base.
 */

import { Router } from "express";
import { z } from "zod";
import { ErrorPagoDuplicado, ErrorSupabase } from "../errores.js";
import type { ClienteSupabase } from "../lib/supabase.js";
import type { FilaPlanUsuario, PlanUsuario } from "../tipos.js";

/** Código Postgres de violación de unicidad (unique_violation). */
const CODIGO_UNIQUE_VIOLATION = "23505";

const ActualizarPlanSchema = z.object({
  plan: z.enum(["gratis", "premium"]),
  pagoHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .nullable()
    .optional(),
  pagoMoneda: z.enum(["ARGt", "BRAt"]).nullable().optional(),
  pagoVerificadoEn: z.string().datetime().nullable().optional(),
});

function aPlan(fila: FilaPlanUsuario): PlanUsuario {
  return {
    plan: fila.plan,
    actualizadoEn: fila.actualizado_en,
    pagoHash: fila.pago_hash,
    pagoMoneda: fila.pago_moneda,
    pagoVerificadoEn: fila.pago_verificado_en,
  };
}

export function rutasPlan(supabase: ClienteSupabase): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    const userId = req.userId as string;

    // Asegura que la fila exista (default 'gratis' por la columna); si ya
    // existía, ignoreDuplicates la deja intacta — sin condición de carrera
    // entre el "no existe" y el "la creo".
    const upsert = await supabase
      .from("plan_usuario")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
    if (upsert.error) return next(new ErrorSupabase("No se pudo inicializar el plan.", upsert.error));

    const { data, error } = await supabase
      .from("plan_usuario")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) return next(new ErrorSupabase("No se pudo obtener el plan.", error));
    res.json(aPlan(data as FilaPlanUsuario));
  });

  router.put("/", async (req, res, next) => {
    const parsed = ActualizarPlanSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);

    const { data, error } = await supabase
      .from("plan_usuario")
      .upsert(
        {
          user_id: req.userId as string,
          plan: parsed.data.plan,
          pago_hash: parsed.data.pagoHash ?? null,
          pago_moneda: parsed.data.pagoMoneda ?? null,
          pago_verificado_en: parsed.data.pagoVerificadoEn ?? null,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (error) {
      if (error.code === CODIGO_UNIQUE_VIOLATION) return next(new ErrorPagoDuplicado());
      return next(new ErrorSupabase("No se pudo actualizar el plan.", error));
    }
    res.json(aPlan(data as FilaPlanUsuario));
  });

  return router;
}
