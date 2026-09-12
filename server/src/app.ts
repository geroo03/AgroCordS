/**
 * Factory de la app Express — sin `.listen()`, así los tests la importan y
 * le pegan con supertest directo, sin levantar un puerto real. El bootstrap
 * que sí escucha está en index.ts.
 */

import cors from "cors";
import express, { type Express } from "express";
import { crearVerificarAuth } from "./middleware/auth.js";
import { manejoErrores } from "./middleware/manejoErrores.js";
import { montarRutas } from "./rutas/index.js";
import type { ClienteSupabase } from "./lib/supabase.js";

export function crearApp(supabase: ClienteSupabase, corsOrigin: string): Express {
  const app = express();

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  // Sin auth: para Railway/monitoreo, y para poder confirmar que el proceso
  // está vivo sin necesitar un token.
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(crearVerificarAuth(supabase));
  app.use(montarRutas(supabase));

  // Siempre al final: Express sólo lo trata como manejador de errores porque
  // declara los 4 parámetros (err, req, res, next).
  app.use(manejoErrores);

  return app;
}
