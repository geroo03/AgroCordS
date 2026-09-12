import type { Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerSerieSatelital } from "../lib/satelital";
import { _limpiarCacheParaTests } from "../lib/satelital/cache";
import { calcularNdre, calcularNdvi } from "../lib/satelital/indices";
import { _resetTokenParaTests } from "../lib/satelital/sentinelhub";
import { ConsultaSatelitalSchema } from "../lib/satelital/validacion";

// Rectángulo de ~1,9 km × 2,2 km cerca de Marcos Juárez (≈ 400 ha).
const POLIGONO_VALIDO: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [-62.11, -32.71],
      [-62.09, -32.71],
      [-62.09, -32.69],
      [-62.11, -32.69],
      [-62.11, -32.71],
    ],
  ],
};

const aIso = (d: Date) => d.toISOString().slice(0, 10);
const HOY = aIso(new Date());
const HACE_100_DIAS = aIso(new Date(Date.now() - 100 * 86_400_000));

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Mock de fetch: token OK y, para la Statistical API, lo que se le pase. */
function mockearSentinelHub(estadisticas: () => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes("openid-connect/token")) {
        return respuestaJson({ access_token: "token-de-prueba", expires_in: 3600 });
      }
      return estadisticas();
    }),
  );
}

function intervalo(fecha: string, ndvi: number, ndre: number, muestras: number, sinDato: number) {
  return {
    interval: { from: `${fecha}T00:00:00Z`, to: `${fecha}T23:59:59Z` },
    outputs: {
      ndvi: { bands: { B0: { stats: { mean: ndvi, sampleCount: muestras, noDataCount: sinDato } } } },
      ndre: { bands: { B0: { stats: { mean: ndre, sampleCount: muestras, noDataCount: sinDato } } } },
      dataMask: { bands: { B0: { stats: { mean: 1, sampleCount: muestras, noDataCount: sinDato } } } },
    },
  };
}

describe("validación de la consulta satelital", () => {
  it("1. acepta un polígono válido con fechas y rango razonables", () => {
    const r = ConsultaSatelitalSchema.safeParse({
      polygon: JSON.stringify(POLIGONO_VALIDO),
      from: HACE_100_DIAS,
      to: HOY,
    });
    expect(r.success).toBe(true);
  });

  it("2. rechaza un polígono inválido (menos de 4 vértices, JSON roto, fuera de rango)", () => {
    const pocosVertices = ConsultaSatelitalSchema.safeParse({
      polygon: JSON.stringify({ type: "Polygon", coordinates: [[[0, 0], [1, 1]]] }),
      from: HACE_100_DIAS,
      to: HOY,
    });
    expect(pocosVertices.success).toBe(false);

    const jsonRoto = ConsultaSatelitalSchema.safeParse({
      polygon: "{no es json",
      from: HACE_100_DIAS,
      to: HOY,
    });
    expect(jsonRoto.success).toBe(false);

    const fueraDeRango = ConsultaSatelitalSchema.safeParse({
      polygon: JSON.stringify({
        type: "Polygon",
        coordinates: [[[200, 0], [201, 0], [201, 1], [200, 1], [200, 0]]],
      }),
      from: HACE_100_DIAS,
      to: HOY,
    });
    expect(fueraDeRango.success).toBe(false);
  });

  it("3. rechaza fechas inválidas: formato, rango invertido, futuro y rango excesivo", () => {
    const base = { polygon: JSON.stringify(POLIGONO_VALIDO) };
    expect(ConsultaSatelitalSchema.safeParse({ ...base, from: "01-05-2026", to: HOY }).success).toBe(false);
    expect(ConsultaSatelitalSchema.safeParse({ ...base, from: HOY, to: HACE_100_DIAS }).success).toBe(false);
    const manana = aIso(new Date(Date.now() + 86_400_000));
    expect(ConsultaSatelitalSchema.safeParse({ ...base, from: HACE_100_DIAS, to: manana }).success).toBe(false);
    const hace2Anios = aIso(new Date(Date.now() - 730 * 86_400_000));
    expect(ConsultaSatelitalSchema.safeParse({ ...base, from: hace2Anios, to: HOY }).success).toBe(false);
  });
});

describe("obtenerSerieSatelital", () => {
  const entornoOriginal = { ...process.env };

  beforeEach(() => {
    process.env = { ...entornoOriginal };
    delete process.env.SENTINELHUB_CLIENT_ID;
    delete process.env.SENTINELHUB_CLIENT_SECRET;
    _limpiarCacheParaTests();
    _resetTokenParaTests();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    process.env = entornoOriginal;
  });

  const parametros = {
    polygon: POLIGONO_VALIDO,
    desde: HACE_100_DIAS,
    hasta: HOY,
    coberturaNubesMax: 30,
  };

  it("4. sin credenciales usa el fallback de demostración y lo marca como tal", async () => {
    const fetchEspia = vi.fn();
    vi.stubGlobal("fetch", fetchEspia);

    const serie = await obtenerSerieSatelital(parametros);

    expect(serie.fuente).toBe("demo");
    expect(serie.real).toBe(false);
    expect(serie.advertencia).toBeUndefined();
    expect(serie.observaciones.length).toBeGreaterThan(0);
    expect(fetchEspia).not.toHaveBeenCalled();
  });

  it("5. con respuesta válida de Sentinel Hub normaliza fechas, valores y nubes", async () => {
    process.env.SENTINELHUB_CLIENT_ID = "id";
    process.env.SENTINELHUB_CLIENT_SECRET = "secreto";
    mockearSentinelHub(() =>
      respuestaJson({
        data: [
          intervalo("2026-08-11", 0.612, 0.338, 200, 20),
          intervalo("2026-08-01", 0.734, 0.412, 200, 10),
        ],
      }),
    );

    const serie = await obtenerSerieSatelital(parametros);

    expect(serie.fuente).toBe("sentinel-2");
    expect(serie.real).toBe(true);
    expect(serie.advertencia).toBeUndefined();
    expect(serie.observaciones.map((o) => o.fecha)).toEqual(["2026-08-01", "2026-08-11"]);
    expect(serie.observaciones[0]).toEqual({
      fecha: "2026-08-01",
      ndvi: 0.73,
      ndre: 0.41,
      coberturaNubesPct: 5,
    });
    expect(serie.observaciones[1].coberturaNubesPct).toBe(10);
  });

  it("6. sin observaciones válidas devuelve una serie REAL vacía, no demo", async () => {
    process.env.SENTINELHUB_CLIENT_ID = "id";
    process.env.SENTINELHUB_CLIENT_SECRET = "secreto";
    mockearSentinelHub(() => respuestaJson({ data: [] }));

    const serie = await obtenerSerieSatelital(parametros);

    expect(serie.fuente).toBe("sentinel-2");
    expect(serie.real).toBe(true);
    expect(serie.observaciones).toHaveLength(0);
  });

  it("7. una pasada dominada por nubes se conserva con valores null, no se inventa", async () => {
    process.env.SENTINELHUB_CLIENT_ID = "id";
    process.env.SENTINELHUB_CLIENT_SECRET = "secreto";
    mockearSentinelHub(() =>
      respuestaJson({
        data: [
          intervalo("2026-08-06", 0.6, 0.3, 200, 190),
          intervalo("2026-08-01", 0.7, 0.4, 200, 0),
        ],
      }),
    );

    const serie = await obtenerSerieSatelital(parametros);

    expect(serie.observaciones).toHaveLength(2);
    const nublada = serie.observaciones[1];
    expect(nublada.fecha).toBe("2026-08-06");
    expect(nublada.ndvi).toBeNull();
    expect(nublada.ndre).toBeNull();
    expect(nublada.coberturaNubesPct).toBeGreaterThanOrEqual(90);
    expect(serie.observaciones[0].ndvi).toBe(0.7);
  });

  it("8. NDVI = (B08 − B04) / (B08 + B04)", () => {
    expect(calcularNdvi(0.45, 0.08)).toBeCloseTo((0.45 - 0.08) / (0.45 + 0.08), 6);
    expect(calcularNdvi(0.3, 0.3)).toBe(0);
    expect(calcularNdvi(0, 0)).toBe(0);
  });

  it("9. NDRE = (B08 − B05) / (B08 + B05)", () => {
    expect(calcularNdre(0.45, 0.2)).toBeCloseTo((0.45 - 0.2) / (0.45 + 0.2), 6);
    expect(calcularNdre(0.45, 0.2)).toBeLessThan(calcularNdvi(0.45, 0.08));
  });

  it("10. si Sentinel Hub falla, cae al fallback con advertencia y sin romper", async () => {
    process.env.SENTINELHUB_CLIENT_ID = "id";
    process.env.SENTINELHUB_CLIENT_SECRET = "secreto";
    mockearSentinelHub(() => respuestaJson({ error: "boom" }, 500));

    const serie = await obtenerSerieSatelital(parametros);

    expect(serie.fuente).toBe("demo");
    expect(serie.real).toBe(false);
    expect(serie.advertencia).toBe("El proveedor satelital no respondió correctamente.");
    expect(serie.observaciones.length).toBeGreaterThan(0);
    expect(console.error).toHaveBeenCalled();
  });

  it("11. credenciales rechazadas → AUTH_ERROR y fallback", async () => {
    process.env.SENTINELHUB_CLIENT_ID = "id";
    process.env.SENTINELHUB_CLIENT_SECRET = "incorrecto";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respuestaJson({ error: "invalid_client" }, 401)),
    );

    const serie = await obtenerSerieSatelital(parametros);

    expect(serie.real).toBe(false);
    expect(serie.advertencia).toBe("No pudimos autenticar con el proveedor satelital.");
  });

  it("12. la segunda consulta idéntica sale del cache sin volver a Sentinel Hub", async () => {
    process.env.SENTINELHUB_CLIENT_ID = "id";
    process.env.SENTINELHUB_CLIENT_SECRET = "secreto";
    mockearSentinelHub(() =>
      respuestaJson({ data: [intervalo("2026-08-01", 0.7, 0.4, 100, 0)] }),
    );

    await obtenerSerieSatelital(parametros);
    const llamadasTrasPrimera = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await obtenerSerieSatelital(parametros);

    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(llamadasTrasPrimera);
  });
});
