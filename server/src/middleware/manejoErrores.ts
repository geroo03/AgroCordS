/**
 * Middleware central de errores — el último que monta app.ts. Traduce cada
 * error tipado a un status HTTP y un mensaje apto para el usuario; el detalle
 * completo va siempre a console.error, nunca a la respuesta.
 */

import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import {
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorPagoDuplicado,
  ErrorSolicitudInvalida,
  ErrorSupabase,
} from "../errores.js";

export const manejoErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    console.error("[solicitud inválida]", err.issues);
    res.status(400).json({ error: "Solicitud inválida.", detalle: err.issues });
    return;
  }
  if (err instanceof ErrorSolicitudInvalida) {
    console.error("[solicitud inválida]", err.message, err.detalle);
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof ErrorNoAutorizado) {
    res.status(401).json({ error: err.message });
    return;
  }
  if (err instanceof ErrorNoEncontrado) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof ErrorPagoDuplicado) {
    res.status(409).json({ error: err.message });
    return;
  }
  if (err instanceof ErrorSupabase) {
    console.error("[error de Supabase]", err.message, err.causa);
    res.status(502).json({ error: "No pudimos completar la operación. Reintentá en unos minutos." });
    return;
  }

  console.error("[error no manejado]", err);
  res.status(500).json({ error: "Ocurrió un error inesperado." });
};
