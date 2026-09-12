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

const cuerpo = { loteId: "1a2b3c4d-0000-4000-8000-000000000001", ventanaInicio: "2026-09-13T06:00" };

describe("GET /notificaciones", () => {
  it("lista las del usuario", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("notificaciones_enviadas", {
      data: [{ id: 1, user_id: USER_ID, lote_id: cuerpo.loteId, ventana_inicio: cuerpo.ventanaInicio, enviado_en: "2026-09-13T05:00:00.000Z" }],
      error: null,
    });

    const res = await request(app).get("/notificaciones").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ loteId: cuerpo.loteId, ventanaInicio: cuerpo.ventanaInicio }]);
  });
});

describe("POST /notificaciones", () => {
  it("body inválido → 400", async () => {
    const { app } = appConAuth();
    const res = await request(app)
      .post("/notificaciones")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ loteId: "no-es-uuid" });
    expect(res.status).toBe(400);
  });

  it("alta nueva → 201", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("notificaciones_enviadas", {
      data: { id: 1, user_id: USER_ID, lote_id: cuerpo.loteId, ventana_inicio: cuerpo.ventanaInicio, enviado_en: "2026-09-13T05:00:00.000Z" },
      error: null,
    });

    const res = await request(app)
      .post("/notificaciones")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send(cuerpo);
    expect(res.status).toBe(201);
  });

  it("alta duplicada (misma ventana ya notificada) → 200, idempotente, no error", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("notificaciones_enviadas", {
      data: null,
      error: { message: "duplicate key value violates unique constraint", code: "23505" },
    });

    const res = await request(app)
      .post("/notificaciones")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send(cuerpo);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cuerpo);
  });
});
