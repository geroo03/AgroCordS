import type { Polygon } from "geojson";
import type {
  HourAssessment,
  ProductType,
  SprayWindow,
} from "./spray-engine";

/** Un lote productivo con su polígono y las medidas derivadas. */
export interface Lote {
  id: string;
  nombre: string;
  cultivo: string | null;
  geometry: Polygon;
  centroidLat: number;
  centroidLng: number;
  areaHa: number;
  /** ISO UTC del momento de alta. */
  creadoEn: string;
}

/**
 * Registro de una aplicación. `condiciones` es el HourAssessment completo del
 * momento: un snapshot inmutable que no se recalcula aunque cambien los
 * umbrales del motor.
 */
export interface Aplicacion {
  id: string;
  loteId: string;
  productoNombre: string;
  tipoProducto: ProductType;
  /** ISO UTC del momento del registro. */
  aplicadaEn: string;
  condiciones: HourAssessment;
  notas: string | null;
}

/** Respuesta de GET /api/forecast. */
export interface ForecastResponsePayload {
  generatedAt: string;
  timezone: string;
  productType: ProductType;
  current: HourAssessment | null;
  hours: HourAssessment[];
  windows: SprayWindow[];
}
