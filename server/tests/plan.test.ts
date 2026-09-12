import { describe, expect, it } from "vitest";
import request from "supertest";
import { crearApp } from "../src/app.js";
import { crearSupabaseFalso } from "./apoyo.js";

const TOKEN = "valido";
const USER_ID = "usuario-1";

function appConAuth() {
  const doble = crearSupabaseFalso();
  doble.programarUsuario(TOKEN, USER_ID);
  return { app: crearApp(doble.cliente, "http://localhost:3000"), ...doble };
}

const filaPlanGratis = {
  user_id: USER_ID,
  plan: "gratis",
  actualizado_en: "2026-06-01T00:00:00.000Z",
  pago_hash: null,
  pago_moneda: null,
  pago_verificado_en: null,
};

describe("GET /plan", () => {
  it("primera consulta: crea la fila (upsert) y la devuelve en 'gratis'", async () => {
    const { app, programarResultado } = appConAuth();
    // 1) upsert de inicialización (no se lee su resultado más que el error)
    programarResultado("plan_usuario", { data: null, error: null });
    // 2) select de vuelta
    programarResultado("plan_usuario", { data: filaPlanGratis, error: null });

    const res = await request(app).get("/plan").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      plan: "gratis",
      actualizadoEn: "2026-06-01T00:00:00.000Z",
      pagoHash: null,
      pagoMoneda: null,
      pagoVerificadoEn: null,
    });
  });
});

describe("PUT /plan", () => {
  it("body inválido → 400", async () => {
    const { app } = appConAuth();
    const res = await request(app)
      .put("/plan")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ plan: "vip" });
    expect(res.status).toBe(400);
  });

  it("activa premium con un pago válido → 200", async () => {
    const { app, programarResultado } = appConAuth();
    const filaPremium = {
      ...filaPlanGratis,
      plan: "premium",
      pago_hash: `0x${"a".repeat(64)}`,
      pago_moneda: "ARGt",
      pago_verificado_en: "2026-06-15T10:00:00.000Z",
    };
    programarResultado("plan_usuario", { data: filaPremium, error: null });

    const res = await request(app)
      .put("/plan")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({
        plan: "premium",
        pagoHash: `0x${"a".repeat(64)}`,
        pagoMoneda: "ARGt",
        pagoVerificadoEn: "2026-06-15T10:00:00.000Z",
      });
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe("premium");
  });

  it("el mismo pago_hash usado antes → 409, no 500", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("plan_usuario", {
      data: null,
      error: { message: "duplicate key value violates unique constraint", code: "23505" },
    });

    const res = await request(app)
      .put("/plan")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ plan: "premium", pagoHash: `0x${"a".repeat(64)}`, pagoMoneda: "ARGt" });
    expect(res.status).toBe(409);
  });
});
