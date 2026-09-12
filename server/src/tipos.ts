/**
 * Tipos de dominio, duplicados a propósito desde la app Next.js
 * (src/lib/tipos.ts, plan.ts, chat/limite.ts, notificaciones.ts).
 *
 * `server/` es un proyecto Node independiente (sin npm workspaces todavía),
 * así que no comparte código con la app Next.js. MANTENER EN SYNC A MANO: si
 * `Lote`/`Aplicacion`/etc. cambian ahí, reflejar el cambio acá también.
 *
 * Los tipos "Fila*" reflejan las columnas snake_case tal cual las devuelve
 * Postgres/Supabase (ver supabase/migrations/20260912114804_esquema_inicial.sql);
 * los demás son la forma camelCase que expone esta API — cada ruta traduce
 * entre una y otra explícitamente, nunca se filtra snake_case al cliente.
 */

// ── Lotes ────────────────────────────────────────────────────

export interface Lote {
  readonly id: string;
  readonly nombre: string;
  readonly cultivo: string | null;
  /** Fecha civil 'YYYY-MM-DD', sin hora. */
  readonly fechaSiembra: string | null;
  /** GeoJSON Polygon, tal cual lo genera Leaflet + Turf en el cliente. */
  readonly geometry: unknown;
  readonly centroidLat: number;
  readonly centroidLng: number;
  readonly areaHa: number;
  /** ISO UTC. */
  readonly creadoEn: string;
}

export interface NuevoLote {
  readonly nombre: string;
  readonly cultivo: string | null;
  readonly fechaSiembra: string | null;
  readonly geometry: unknown;
  readonly centroidLat: number;
  readonly centroidLng: number;
  readonly areaHa: number;
}

export interface FilaLote {
  readonly id: string;
  readonly user_id: string;
  readonly nombre: string;
  readonly cultivo: string | null;
  readonly fecha_siembra: string | null;
  readonly geometry: unknown;
  readonly centroid_lat: number;
  readonly centroid_lng: number;
  readonly area_ha: number;
  readonly creado_en: string;
}

// ── Aplicaciones ─────────────────────────────────────────────

export type ProductType = "sistemico" | "contacto";

export interface Aplicacion {
  readonly id: string;
  readonly loteId: string;
  readonly productoNombre: string;
  readonly tipoProducto: ProductType;
  /** ISO UTC. */
  readonly aplicadaEn: string;
  /** HourAssessment congelado (spray-engine.ts en la app Next.js). No se
   *  re-valida su forma interna en detalle: es un snapshot de cumplimiento,
   *  se guarda tal cual llega. */
  readonly condiciones: unknown;
  readonly notas: string | null;
}

export interface NuevaAplicacion {
  readonly loteId: string;
  readonly productoNombre: string;
  readonly tipoProducto: ProductType;
  readonly condiciones: unknown;
  readonly notas: string | null;
}

export interface FilaAplicacion {
  readonly id: string;
  readonly lote_id: string;
  readonly user_id: string;
  readonly producto_nombre: string;
  readonly tipo_producto: ProductType;
  readonly aplicada_en: string;
  readonly condiciones: unknown;
  readonly notas: string | null;
}

// ── Plan del usuario ─────────────────────────────────────────

export type PlanNombre = "gratis" | "premium";
export type Moneda = "ARGt" | "BRAt";

export interface PlanUsuario {
  readonly plan: PlanNombre;
  readonly actualizadoEn: string;
  readonly pagoHash: string | null;
  readonly pagoMoneda: Moneda | null;
  readonly pagoVerificadoEn: string | null;
}

export interface ActualizarPlan {
  readonly plan: PlanNombre;
  readonly pagoHash?: string | null;
  readonly pagoMoneda?: Moneda | null;
  readonly pagoVerificadoEn?: string | null;
}

export interface FilaPlanUsuario {
  readonly user_id: string;
  readonly plan: PlanNombre;
  readonly actualizado_en: string;
  readonly pago_hash: string | null;
  readonly pago_moneda: Moneda | null;
  readonly pago_verificado_en: string | null;
}

// ── Uso diario del chat ──────────────────────────────────────

export interface UsoChatDiario {
  readonly fecha: string;
  readonly consultas: number;
}

export interface FilaUsoChatDiario {
  readonly user_id: string;
  readonly fecha: string;
  readonly consultas: number;
}

// ── Notificaciones enviadas ──────────────────────────────────

export interface NotificacionEnviada {
  readonly loteId: string;
  /** Hora de inicio de la ventana, ISO local del lote en texto — nunca se
   *  reinterpreta como timestamptz (misma convención que HourAssessment.time
   *  en la app Next.js). */
  readonly ventanaInicio: string;
}

export interface FilaNotificacionEnviada {
  readonly id: number;
  readonly user_id: string;
  readonly lote_id: string;
  readonly ventana_inicio: string;
  readonly enviado_en: string;
}
