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

const cuerpoValido = {
  loteId: "1a2b3c4d-0000-4000-8000-000000000001",
  productoNombre: "Roundup Full II",
  tipoProducto: "sistemico",
  condiciones: { suitability: "optima" },
  notas: null,
};

describe("GET /aplicaciones", () => {
  it("lista todas las del usuario, traducidas a camelCase", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("aplicaciones", {
      data: [
        {
          id: "ap-1",
          lote_id: cuerpoValido.loteId,
          user_id: USER_ID,
          producto_nombre: "Roundup Full II",
          tipo_producto: "sistemico",
          aplicada_en: "2026-06-10T12:00:00.000Z",
          condiciones: { suitability: "optima" },
          notas: null,
        },
      ],
      error: null,
    });

    const res = await request(app).get("/aplicaciones").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body[0].loteId).toBe(cuerpoValido.loteId);
  });
});

describe("POST /aplicaciones", () => {
  it("body inválido → 400", async () => {
    const { app } = appConAuth();
    const res = await request(app)
      .post("/aplicaciones")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ productoNombre: "Roundup" }); // falta loteId, tipoProducto
    expect(res.status).toBe(400);
  });

  it("lote ajeno o inexistente → 404, no llega a insertar", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("lotes", { data: null, error: null });

    const res = await request(app)
      .post("/aplicaciones")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send(cuerpoValido);
    expect(res.status).toBe(404);
  });

  it("alta válida sobre un lote propio → 201", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("lotes", { data: { id: cuerpoValido.loteId }, error: null });
    programarResultado("aplicaciones", {
      data: {
        id: "ap-1",
        lote_id: cuerpoValido.loteId,
        user_id: USER_ID,
        producto_nombre: "Roundup Full II",
        tipo_producto: "sistemico",
        aplicada_en: "2026-06-10T12:00:00.000Z",
        condiciones: { suitability: "optima" },
        notas: null,
      },
      error: null,
    });

    const res = await request(app)
      .post("/aplicaciones")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send(cuerpoValido);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("ap-1");
  });
});
