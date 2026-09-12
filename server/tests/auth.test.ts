import { describe, expect, it } from "vitest";
import request from "supertest";
import { crearApp } from "../src/app.js";
import { crearSupabaseFalso } from "./apoyo.js";

describe("autenticación", () => {
  it("sin token → 401", async () => {
    const { cliente } = crearSupabaseFalso();
    const app = crearApp(cliente, "http://localhost:3000");

    const res = await request(app).get("/lotes");
    expect(res.status).toBe(401);
  });

  it("token con formato inválido (sin 'Bearer ') → 401", async () => {
    const { cliente } = crearSupabaseFalso();
    const app = crearApp(cliente, "http://localhost:3000");

    const res = await request(app).get("/lotes").set("Authorization", "token-suelto");
    expect(res.status).toBe(401);
  });

  it("token no reconocido por Supabase → 401", async () => {
    const { cliente } = crearSupabaseFalso();
    const app = crearApp(cliente, "http://localhost:3000");

    const res = await request(app).get("/lotes").set("Authorization", "Bearer no-existe");
    expect(res.status).toBe(401);
  });

  it("token válido → sigue a la ruta (no corta en 401)", async () => {
    const { cliente, programarUsuario, programarResultado } = crearSupabaseFalso();
    programarUsuario("valido", "usuario-1");
    programarResultado("lotes", { data: [], error: null });
    const app = crearApp(cliente, "http://localhost:3000");

    const res = await request(app).get("/lotes").set("Authorization", "Bearer valido");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("/health no requiere token", async () => {
    const { cliente } = crearSupabaseFalso();
    const app = crearApp(cliente, "http://localhost:3000");

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
