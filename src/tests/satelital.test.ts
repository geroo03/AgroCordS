import type { Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerSerieSatelital } from "../lib/satelital";
import { _limpiarCacheParaTests } from "../lib/satelital/cache";
import { EVALSCRIPT_NDVI_NDRE, SCL_DESCARTADAS } from "../lib/satelital/evalscript";
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
      confianza: "alta",
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

  it("13. dos intervalos de la misma fecha se fusionan en una observación, ponderados por píxeles válidos", async () => {
    process.env.SENTINELHUB_CLIENT_ID = "id";
    process.env.SENTINELHUB_CLIENT_SECRET = "secreto";
    // El lote cae sobre el solape de dos órbitas: el satélite pasó UNA vez.
    mockearSentinelHub(() =>
      respuestaJson({
        data: [
          intervalo("2026-08-01", 0.8, 0.4, 300, 0),
          intervalo("2026-08-01", 0.6, 0.3, 100, 0),
        ],
      }),
    );

    const serie = await obtenerSerieSatelital(parametros);

    expect(serie.observaciones).toHaveLength(1);
    // (0,8·300 + 0,6·100) / 400 = 0,75 — no 0,70, que sería el promedio simple.
    expect(serie.observaciones[0].ndvi).toBe(0.75);
    expect(serie.observaciones[0].ndre).toBe(0.38);
    expect(serie.observaciones[0].coberturaNubesPct).toBe(0);
  });

  it("14. la confianza refleja qué fracción del lote quedó limpia, no un corte binario", async () => {
    process.env.SENTINELHUB_CLIENT_ID = "id";
    process.env.SENTINELHUB_CLIENT_SECRET = "secreto";

    const casos = [
      { sinDato: 50, confianza: "alta", conValor: true },
      { sinDato: 200, confianza: "media", conValor: true },
      { sinDato: 400, confianza: "baja", conValor: true },
      { sinDato: 600, confianza: "nula", conValor: false },
    ] as const;

    for (const caso of casos) {
      _limpiarCacheParaTests();
      mockearSentinelHub(() =>
        respuestaJson({ data: [intervalo("2026-08-01", 0.7, 0.4, 1000, caso.sinDato)] }),
      );

      const serie = await obtenerSerieSatelital(parametros);
      const observacion = serie.observaciones[0];

      expect(observacion.confianza).toBe(caso.confianza);
      // La invariante del tipo: "nula" ⟺ sin valores.
      expect(observacion.ndvi !== null).toBe(caso.conValor);
    }
  });

  it("15. la serie de demostración no declara confianza: no hay píxeles que contar", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const serie = await obtenerSerieSatelital(parametros);

    expect(serie.real).toBe(false);
    expect(serie.observaciones.every((o) => o.confianza === null)).toBe(true);
    expect(serie.observaciones.every((o) => o.coberturaNubesPct === null)).toBe(true);
  });
});

/**
 * La máscara se ejecuta en los servidores de Sentinel Hub, así que estos
 * casos evalúan el evalscript REAL que se envía: se compila el string y se
 * llama a su `evaluatePixel`. Comparar el texto no serviría — lo que importa
 * es qué píxel sobrevive.
 */
describe("máscara de nubes del evalscript", () => {
  const { evaluatePixel } = new Function(
    `${EVALSCRIPT_NDVI_NDRE}; return { setup: setup, evaluatePixel: evaluatePixel };`,
  )() as { evaluatePixel: (m: Record<string, number>) => { dataMask: number[]; ndvi: number[] } };

  /** Píxel de cultivo sano; `scl` y las bandas se pisan por caso. */
  const pixel = (scl: number, extra: Record<string, number> = {}) =>
    evaluatePixel({ B04: 0.08, B05: 0.2, B08: 0.45, SCL: scl, dataMask: 1, ...extra });

  it("16. deja pasar el píxel limpio y calcula el índice de `indices.ts`", () => {
    const salida = pixel(4); // 4 = vegetación
    expect(salida.dataMask[0]).toBe(1);
    expect(salida.ndvi[0]).toBeCloseTo(calcularNdvi(0.45, 0.08), 6);
  });

  it("17. descarta sin dato, saturado, sombra de nube, nube, cirro y nieve", () => {
    for (const scl of SCL_DESCARTADAS) {
      expect(pixel(scl).dataMask[0], `SCL ${scl} debería descartarse`).toBe(0);
    }
  });

  it("18. conserva sombra proyectada, agua y no clasificado: son estados del lote, no artefactos", () => {
    for (const scl of [2, 6, 7]) {
      expect(pixel(scl).dataMask[0], `SCL ${scl} debería conservarse`).toBe(1);
    }
  });

  it("19. un píxel con índice indefinido se descarta en vez de emitir NaN", () => {
    // B08 + B04 = 0: sin guarda, la división emite NaN y NaN contamina el
    // promedio de toda la fecha, porque Sentinel Hub no lo filtra.
    const salida = pixel(4, { B04: 0, B05: 0, B08: 0 });
    expect(salida.dataMask[0]).toBe(0);
    expect(Number.isNaN(salida.ndvi[0])).toBe(false);
  });

  it("20. el píxel fuera del polígono se descarta aunque la clase SCL sea limpia", () => {
    expect(pixel(4, { dataMask: 0 }).dataMask[0]).toBe(0);
  });

  it("21. una clase SCL no entera por remuestreo se redondea antes de comparar", () => {
    // SCL viene a 20 m y se remuestrea a 10 m; sin redondeo, 8,8 no estaría en
    // la lista de descartadas y una nube pasaría como píxel limpio.
    expect(pixel(8.8).dataMask[0]).toBe(0);
    expect(pixel(4.2).dataMask[0]).toBe(1);
  });
});
