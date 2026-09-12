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

describe("GET /chat/uso", () => {
  it("sin fila todavía hoy → 0 consultas, no 404", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("uso_chat_diario", { data: null, error: null });

    const res = await request(app).get("/chat/uso").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.consultas).toBe(0);
  });

  it("con fila hoy, devuelve el conteo guardado", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("uso_chat_diario", {
      data: { user_id: USER_ID, fecha: "2026-09-12", consultas: 3 },
      error: null,
    });

    const res = await request(app).get("/chat/uso").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.consultas).toBe(3);
  });
});

describe("POST /chat/uso", () => {
  it("incrementa desde cero", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("uso_chat_diario", { data: null, error: null }); // lectura: sin fila
    programarResultado("uso_chat_diario", {
      data: { user_id: USER_ID, fecha: "2026-09-12", consultas: 1 },
      error: null,
    });

    const res = await request(app).post("/chat/uso").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(201);
    expect(res.body.consultas).toBe(1);
  });

  it("incrementa sobre un conteo existente", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("uso_chat_diario", { data: { consultas: 4 }, error: null });
    programarResultado("uso_chat_diario", {
      data: { user_id: USER_ID, fecha: "2026-09-12", consultas: 5 },
      error: null,
    });

    const res = await request(app).post("/chat/uso").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(201);
    expect(res.body.consultas).toBe(5);
  });
});
