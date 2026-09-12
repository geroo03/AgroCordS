import { describe, expect, it } from "vitest";
import request from "supertest";
import { crearApp } from "../src/app.js";
import { crearSupabaseFalso } from "./apoyo.js";

const TOKEN = "valido";
const USER_ID = "usuario-1";

const filaLote = {
  id: "lote-1",
  user_id: USER_ID,
  nombre: "La Esperanza",
  cultivo: "Soja",
  fecha_siembra: "2026-06-05",
  geometry: { type: "Polygon", coordinates: [[[-62.1, -32.7], [-62.09, -32.7], [-62.09, -32.69], [-62.1, -32.69], [-62.1, -32.7]]] },
  centroid_lat: -32.7,
  centroid_lng: -62.1,
  area_ha: 45.2,
  creado_en: "2026-06-01T12:00:00.000Z",
};

function appConAuth() {
  const doble = crearSupabaseFalso();
  doble.programarUsuario(TOKEN, USER_ID);
  return { app: crearApp(doble.cliente, "http://localhost:3000"), ...doble };
}

describe("GET /lotes", () => {
  it("lista sólo los del usuario, traducidos a camelCase", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("lotes", { data: [filaLote], error: null });

    const res = await request(app).get("/lotes").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: "lote-1",
        nombre: "La Esperanza",
        cultivo: "Soja",
        fechaSiembra: "2026-06-05",
        geometry: filaLote.geometry,
        centroidLat: -32.7,
        centroidLng: -62.1,
        areaHa: 45.2,
        creadoEn: "2026-06-01T12:00:00.000Z",
      },
    ]);
  });
});

describe("GET /lotes/:id", () => {
  it("404 si no existe o no es del usuario", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("lotes", { data: null, error: null });

    const res = await request(app).get("/lotes/no-existe").set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /lotes", () => {
  it("body inválido → 400", async () => {
    const { app } = appConAuth();

    const res = await request(app)
      .post("/lotes")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({ nombre: "" });
    expect(res.status).toBe(400);
  });

  it("alta válida → 201 con el lote creado", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("lotes", { data: filaLote, error: null });

    const res = await request(app)
      .post("/lotes")
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({
        nombre: "La Esperanza",
        cultivo: "Soja",
        fechaSiembra: "2026-06-05",
        geometry: filaLote.geometry,
        centroidLat: -32.7,
        centroidLng: -62.1,
        areaHa: 45.2,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("lote-1");
  });
});

describe("GET /lotes/:loteId/aplicaciones", () => {
  it("404 si el lote no es del usuario", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("lotes", { data: null, error: null });

    const res = await request(app)
      .get("/lotes/ajeno/aplicaciones")
      .set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(404);
  });

  it("lista las aplicaciones del lote propio", async () => {
    const { app, programarResultado } = appConAuth();
    programarResultado("lotes", { data: { id: "lote-1" }, error: null });
    programarResultado("aplicaciones", {
      data: [
        {
          id: "ap-1",
          lote_id: "lote-1",
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

    const res = await request(app)
      .get("/lotes/lote-1/aplicaciones")
      .set("Authorization", `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: "ap-1",
        loteId: "lote-1",
        productoNombre: "Roundup Full II",
        tipoProducto: "sistemico",
        aplicadaEn: "2026-06-10T12:00:00.000Z",
        condiciones: { suitability: "optima" },
        notas: null,
      },
    ]);
  });
});
