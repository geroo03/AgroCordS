/**
 * Validación de la consulta satelital (parámetros de GET /api/satellite).
 * Vive fuera de la ruta para poder testearla sin levantar Next.
 */

import { z } from "zod";

// Límites propios de la consulta satelital. No son los del alta de lotes en
// `geo.ts` (que sólo fija mínimos): acá importa NO aceptar un polígono
// arbitrariamente grande o complejo, porque encarece la consulta a Sentinel
// Hub sin aportar nada a la demo.
export const VERTICES_MAXIMOS = 300;
export const AREA_MAXIMA_HA = 5000;
export const RANGO_MAXIMO_DIAS = 366;

export const PolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z
    .array(
      z
        .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
        .min(4)
        .max(VERTICES_MAXIMOS),
    )
    .min(1),
});

export const FechaIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido, se espera AAAA-MM-DD")
  .refine((f) => !Number.isNaN(Date.parse(f)), "Fecha inválida");

export function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000);
}

export const ConsultaSatelitalSchema = z
  .object({
    polygon: z.string().transform((valor, ctx) => {
      let json: unknown;
      try {
        json = JSON.parse(valor);
      } catch {
        ctx.addIssue({ code: "custom", message: "El polígono no es JSON válido" });
        return z.NEVER;
      }
      const resultado = PolygonSchema.safeParse(json);
      if (!resultado.success) {
        ctx.addIssue({ code: "custom", message: "El polígono no tiene una forma válida" });
        return z.NEVER;
      }
      return resultado.data;
    }),
    from: FechaIsoSchema,
    to: FechaIsoSchema,
    maxCloudCoverage: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((v) => v.from <= v.to, {
    message: "'from' debe ser anterior o igual a 'to'",
    path: ["from"],
  })
  .refine((v) => diasEntre(v.from, v.to) <= RANGO_MAXIMO_DIAS, {
    message: `El rango entre 'from' y 'to' no puede superar ${RANGO_MAXIMO_DIAS} días`,
    path: ["to"],
  })
  .refine((v) => v.to <= hoyIso(), {
    message: "'to' no puede ser una fecha futura",
    path: ["to"],
  });

export type ConsultaSatelital = z.infer<typeof ConsultaSatelitalSchema>;
