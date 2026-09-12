/**
 * Extiende Request con el user_id que deja el middleware de auth
 * (src/middleware/auth.ts) una vez verificado el token de Supabase.
 */
import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
