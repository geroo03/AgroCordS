/**
 * Lotes del usuario. Espejo de las funciones de lotes en
 * src/lib/almacen.ts (listarLotes, obtenerLote, guardarLote), sobre la tabla
 * `lotes` de Supabase en vez de localStorage.
 */

import { Router } from "express";
import { z } from "zod";
import { ErrorNoEncontrado, ErrorSupabase } from "../errores.js";
import type { ClienteSupabase } from "../lib/supabase.js";
import type { FilaAplicacion, FilaLote, Lote } from "../tipos.js";
import { aAplicacion } from "./aplicaciones.js";

/** GeoJSON Polygon tal cual lo genera Turf/Leaflet en el cliente. */
const GeometriaSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

const NuevoLoteSchema = z.object({
  nombre: z.string().min(1).max(80),
  cultivo: z.string().max(40).nullable().default(null),
  fechaSiembra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  geometry: GeometriaSchema,
  centroidLat: z.number().min(-90).max(90),
  centroidLng: z.number().min(-180).max(180),
  areaHa: z.number().positive(),
});

function aLote(fila: FilaLote): Lote {
  return {
    id: fila.id,
    nombre: fila.nombre,
    cultivo: fila.cultivo,
    fechaSiembra: fila.fecha_siembra,
    geometry: fila.geometry,
    centroidLat: fila.centroid_lat,
    centroidLng: fila.centroid_lng,
    areaHa: fila.area_ha,
    creadoEn: fila.creado_en,
  };
}

export function rutasLotes(supabase: ClienteSupabase): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    const { data, error } = await supabase
      .from("lotes")
      .select("*")
      .eq("user_id", req.userId as string)
      .order("creado_en", { ascending: false });

    if (error) return next(new ErrorSupabase("No se pudieron listar los lotes.", error));
    res.json((data as FilaLote[]).map(aLote));
  });

  router.get("/:id", async (req, res, next) => {
    const { data, error } = await supabase
      .from("lotes")
      .select("*")
      .eq("user_id", req.userId as string)
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) return next(new ErrorSupabase("No se pudo obtener el lote.", error));
    if (!data) return next(new ErrorNoEncontrado("Este lote no existe."));
    res.json(aLote(data as FilaLote));
  });

  router.post("/", async (req, res, next) => {
    const parsed = NuevoLoteSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);

    const { data, error } = await supabase
      .from("lotes")
      .insert({
        user_id: req.userId as string,
        nombre: parsed.data.nombre,
        cultivo: parsed.data.cultivo,
        fecha_siembra: parsed.data.fechaSiembra,
        geometry: parsed.data.geometry,
        centroid_lat: parsed.data.centroidLat,
        centroid_lng: parsed.data.centroidLng,
        area_ha: parsed.data.areaHa,
      })
      .select("*")
      .single();

    if (error) return next(new ErrorSupabase("No se pudo crear el lote.", error));
    res.status(201).json(aLote(data as FilaLote));
  });

  router.get("/:loteId/aplicaciones", async (req, res, next) => {
    // Confirma que el lote sea del usuario antes de listar sus aplicaciones:
    // sin este chequeo, adivinar un id de lote ajeno filtraría su historial.
    const lote = await supabase
      .from("lotes")
      .select("id")
      .eq("user_id", req.userId as string)
      .eq("id", req.params.loteId)
      .maybeSingle();
    if (lote.error) return next(new ErrorSupabase("No se pudo verificar el lote.", lote.error));
    if (!lote.data) return next(new ErrorNoEncontrado("Este lote no existe."));

    const { data, error } = await supabase
      .from("aplicaciones")
      .select("*")
      .eq("user_id", req.userId as string)
      .eq("lote_id", req.params.loteId)
      .order("aplicada_en", { ascending: false });

    if (error) return next(new ErrorSupabase("No se pudieron listar las aplicaciones.", error));
    res.json((data as FilaAplicacion[]).map(aAplicacion));
  });

  return router;
}
