import type { Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import {
  MENSAJE_POLIGONO_CRUZADO,
  MENSAJE_POLIGONO_GRANDE,
  MENSAJE_POLIGONO_INVALIDO,
  medirPoligono,
  mensajeSolapamiento,
  validarPoligono,
  validarSolapamiento,
} from "../lib/geo";

const LAT = -32.7;
const LNG = -62.1;
const KM_POR_GRADO_LAT = 110.574;
const kmPorGradoLng = 111.32 * Math.cos((LAT * Math.PI) / 180);

/** Rectángulo centrado en (lat, lng) con lados en km. */
function rectangulo(anchoKm: number, altoKm: number, lat = LAT, lng = LNG): Polygon {
  const dLat = altoKm / 2 / KM_POR_GRADO_LAT;
  const dLng = anchoKm / 2 / kmPorGradoLng;
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  };
}

/** Mismo rectángulo, corrido hacia el este. */
function corrido(kmAlEste: number, anchoKm = 1, altoKm = 1): Polygon {
  return rectangulo(anchoKm, altoKm, LAT, LNG + kmAlEste / kmPorGradoLng);
}

describe("validarPoligono", () => {
  it("acepta un cuadrado de 1 km (~100 ha)", () => {
    const geometry = rectangulo(1, 1);
    expect(validarPoligono(geometry)).toBeNull();
    expect(Math.abs(medirPoligono(geometry).areaHa - 100)).toBeLessThan(2);
  });

  it("rechaza menos de 4 vértices", () => {
    const triangulo: Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [LNG, LAT],
          [LNG + 0.02, LAT],
          [LNG, LAT + 0.02],
          [LNG, LAT],
        ],
      ],
    };
    expect(validarPoligono(triangulo)).toBe(MENSAJE_POLIGONO_INVALIDO);
  });

  it("rechaza un polígono que se cruza a sí mismo (moño)", () => {
    const d = 0.01;
    const moño: Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [LNG, LAT],
          [LNG + d, LAT + d],
          [LNG + d, LAT],
          [LNG, LAT + d],
          [LNG, LAT],
        ],
      ],
    };
    expect(validarPoligono(moño)).toBe(MENSAJE_POLIGONO_CRUZADO);
  });

  it("rechaza un lote por debajo de 0,5 ha", () => {
    expect(validarPoligono(rectangulo(0.05, 0.05))).toBe(MENSAJE_POLIGONO_INVALIDO);
  });

  it("rechaza un lote por encima de 5.000 ha", () => {
    expect(validarPoligono(rectangulo(10, 10))).toBe(MENSAJE_POLIGONO_GRANDE);
  });
});

describe("validarSolapamiento", () => {
  const existente = { nombre: "Lote 7", geometry: rectangulo(1, 1) };

  it("sin lotes cargados no hay nada que solapar", () => {
    expect(validarSolapamiento(rectangulo(1, 1), [])).toBeNull();
  });

  it("acepta un polígono lejos de los existentes", () => {
    expect(validarSolapamiento(corrido(5), [existente])).toBeNull();
  });

  it("acepta un solapamiento chico (~5%)", () => {
    expect(validarSolapamiento(corrido(0.95), [existente])).toBeNull();
  });

  it("rechaza un solapamiento grande (~80%) nombrando el lote", () => {
    expect(validarSolapamiento(corrido(0.2), [existente])).toBe(
      mensajeSolapamiento("Lote 7"),
    );
  });

  it("rechaza un polígono grande que se traga entero a un lote chico", () => {
    // 16 km² sobre 1 km²: apenas 6% del nuevo, pero el 100% del existente.
    expect(validarSolapamiento(rectangulo(4, 4), [existente])).toBe(
      mensajeSolapamiento("Lote 7"),
    );
  });

  it("revisa contra todos los lotes, no sólo el primero", () => {
    const lejos = { nombre: "Lejano", geometry: corrido(20) };
    expect(validarSolapamiento(corrido(0.2), [lejos, existente])).toBe(
      mensajeSolapamiento("Lote 7"),
    );
  });
});
