/**
 * Catálogo de fitosanitarios para el selector en cascada:
 * Tipo de producto → Principio activo → Nombre comercial.
 *
 * Catálogo curado con los principios activos y marcas más usados en cultivos
 * extensivos de Argentina (soja, maíz, trigo). No es el registro completo:
 * la fuente oficial es el Registro Nacional de Terapéutica Vegetal de SENASA,
 * cuya integración está en la lista de próximos pasos. Se excluyen productos
 * prohibidos o en retiro (paraquat, clorpirifos).
 *
 * `tipo` clasifica el modo de acción a los fines del motor (rain-fastness):
 * un sistémico necesita menos horas sin lluvia que uno de contacto.
 */

import type { ProductType } from "./spray-engine";

export type CategoriaProducto = "herbicida" | "insecticida" | "fungicida";

export const ETIQUETA_CATEGORIA: Record<CategoriaProducto, string> = {
  herbicida: "Herbicidas",
  insecticida: "Insecticidas",
  fungicida: "Fungicidas",
};

export interface PrincipioActivo {
  readonly id: string;
  readonly nombre: string;
  readonly categoria: CategoriaProducto;
  readonly tipo: ProductType;
  readonly comerciales: readonly string[];
}

export const PRINCIPIOS_ACTIVOS: readonly PrincipioActivo[] = [
  // ── Herbicidas sistémicos ──────────────────────────────────
  { id: "glifosato", nombre: "Glifosato", categoria: "herbicida", tipo: "sistemico", comerciales: ["Roundup Full II", "Roundup ControlMax", "Panzer Gold", "Sulfosato Touchdown IQ", "Zamba"] },
  { id: "24d", nombre: "2,4-D", categoria: "herbicida", tipo: "sistemico", comerciales: ["2,4-D Amina Atanor", "Esteron Ultra", "Herbifen Super"] },
  { id: "dicamba", nombre: "Dicamba", categoria: "herbicida", tipo: "sistemico", comerciales: ["Banvel", "Atectra", "Dicamba Atanor"] },
  { id: "atrazina", nombre: "Atrazina", categoria: "herbicida", tipo: "sistemico", comerciales: ["Gesaprim 90 WDG", "Atrazina Atanor 50"] },
  { id: "imazetapir", nombre: "Imazetapir", categoria: "herbicida", tipo: "sistemico", comerciales: ["Pivot H", "Imazetapir 10,6 (genérico)"] },
  { id: "metsulfuron", nombre: "Metsulfurón-metil", categoria: "herbicida", tipo: "sistemico", comerciales: ["Metsulfurón 60 WG (genérico)", "Misil II (con dicamba)"] },
  { id: "clorimuron", nombre: "Clorimurón-etil", categoria: "herbicida", tipo: "sistemico", comerciales: ["Classic", "Clorimurón 25 (genérico)"] },
  { id: "haloxifop", nombre: "Haloxifop-R-metil", categoria: "herbicida", tipo: "sistemico", comerciales: ["Galant HL"] },
  { id: "cletodim", nombre: "Cletodim", categoria: "herbicida", tipo: "sistemico", comerciales: ["Select", "Cletodim 24 (genérico)"] },
  { id: "picloram", nombre: "Picloram", categoria: "herbicida", tipo: "sistemico", comerciales: ["Tordon 24K"] },
  { id: "fluroxipir", nombre: "Fluroxipir", categoria: "herbicida", tipo: "sistemico", comerciales: ["Starane Xtra", "Tomahawk"] },
  { id: "diclosulam", nombre: "Diclosulam", categoria: "herbicida", tipo: "sistemico", comerciales: ["Spider"] },

  // ── Herbicidas de contacto ─────────────────────────────────
  { id: "glufosinato", nombre: "Glufosinato de amonio", categoria: "herbicida", tipo: "contacto", comerciales: ["Liberty", "Glufosinato 20 (genérico)"] },
  { id: "saflufenacil", nombre: "Saflufenacil", categoria: "herbicida", tipo: "contacto", comerciales: ["Heat"] },
  { id: "carfentrazona", nombre: "Carfentrazona-etil", categoria: "herbicida", tipo: "contacto", comerciales: ["Affinity", "Aurora 40 WG"] },
  { id: "flumioxazin", nombre: "Flumioxazín", categoria: "herbicida", tipo: "contacto", comerciales: ["Sumisoya"] },

  // ── Insecticidas sistémicos ────────────────────────────────
  { id: "imidacloprid", nombre: "Imidacloprid", categoria: "insecticida", tipo: "sistemico", comerciales: ["Confidor 35", "Imidacloprid 35 (genérico)"] },
  { id: "tiametoxam", nombre: "Tiametoxam", categoria: "insecticida", tipo: "sistemico", comerciales: ["Actara 25 WG", "Engeo (con lambdacialotrina)"] },
  { id: "acetamiprid", nombre: "Acetamiprid", categoria: "insecticida", tipo: "sistemico", comerciales: ["Mospilan 20 SP"] },
  { id: "clorantraniliprole", nombre: "Clorantraniliprole", categoria: "insecticida", tipo: "sistemico", comerciales: ["Coragen"] },

  // ── Insecticidas de contacto ───────────────────────────────
  { id: "cipermetrina", nombre: "Cipermetrina", categoria: "insecticida", tipo: "contacto", comerciales: ["Cipermetrina 25 (genérico)", "Glextrin 25"] },
  { id: "lambdacialotrina", nombre: "Lambdacialotrina", categoria: "insecticida", tipo: "contacto", comerciales: ["Karate Zeon"] },
  { id: "deltametrina", nombre: "Deltametrina", categoria: "insecticida", tipo: "contacto", comerciales: ["Decis Forte"] },
  { id: "spinetoram", nombre: "Spinetoram", categoria: "insecticida", tipo: "contacto", comerciales: ["Exalt"] },

  // ── Fungicidas sistémicos ──────────────────────────────────
  { id: "tebuconazol", nombre: "Tebuconazol", categoria: "fungicida", tipo: "sistemico", comerciales: ["Folicur 25 EW", "Tebuconazol 43 (genérico)"] },
  { id: "azoxi-cipro", nombre: "Azoxistrobina + ciproconazol", categoria: "fungicida", tipo: "sistemico", comerciales: ["Amistar Xtra"] },
  { id: "pira-epoxi", nombre: "Piraclostrobina + epoxiconazol", categoria: "fungicida", tipo: "sistemico", comerciales: ["Opera"] },
  { id: "triflo-proti", nombre: "Trifloxistrobina + protioconazol", categoria: "fungicida", tipo: "sistemico", comerciales: ["Cripton", "Cripton Xpro (con bixafen)"] },
  { id: "azoxistrobina", nombre: "Azoxistrobina", categoria: "fungicida", tipo: "sistemico", comerciales: ["Amistar", "Azoxistrobina 25 (genérico)"] },
  { id: "carbendazim", nombre: "Carbendazim", categoria: "fungicida", tipo: "sistemico", comerciales: ["Carbendazim 50 (genérico)"] },

  // ── Fungicidas de contacto ─────────────────────────────────
  { id: "mancozeb", nombre: "Mancozeb", categoria: "fungicida", tipo: "contacto", comerciales: ["Dithane M-45", "Mancozeb 80 (genérico)"] },
  { id: "clorotalonil", nombre: "Clorotalonil", categoria: "fungicida", tipo: "contacto", comerciales: ["Bravo 720", "Clorotalonil 72 (genérico)"] },
  { id: "cobre", nombre: "Oxicloruro de cobre", categoria: "fungicida", tipo: "contacto", comerciales: ["Oxicloruro de cobre 84 (genérico)"] },
  { id: "azufre", nombre: "Azufre", categoria: "fungicida", tipo: "contacto", comerciales: ["Kumulus", "Azufre 80 (genérico)"] },
];

export function obtenerPrincipio(id: string): PrincipioActivo | null {
  return PRINCIPIOS_ACTIVOS.find((p) => p.id === id) ?? null;
}

export function principiosPorTipo(tipo: ProductType): PrincipioActivo[] {
  return PRINCIPIOS_ACTIVOS.filter((p) => p.tipo === tipo);
}

// ── Búsqueda por nombre ──────────────────────────────────────

export interface ResultadoBusqueda {
  readonly principio: PrincipioActivo;
  /** null cuando la coincidencia fue por el nombre del principio activo. */
  readonly comercial: string | null;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Busca en nombres comerciales y principios activos, sin distinguir acentos. */
export function buscarProductos(texto: string, limite = 8): ResultadoBusqueda[] {
  const consulta = normalizar(texto.trim());
  if (consulta.length < 2) return [];

  const resultados: ResultadoBusqueda[] = [];

  for (const principio of PRINCIPIOS_ACTIVOS) {
    for (const comercial of principio.comerciales) {
      if (normalizar(comercial).includes(consulta)) {
        resultados.push({ principio, comercial });
      }
    }
  }
  for (const principio of PRINCIPIOS_ACTIVOS) {
    if (normalizar(principio.nombre).includes(consulta)) {
      resultados.push({ principio, comercial: null });
    }
  }

  return resultados.slice(0, limite);
}
