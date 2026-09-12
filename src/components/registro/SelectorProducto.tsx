"use client";

import { useState } from "react";
import type { ProductType } from "@/lib/spray-engine";
import {
  buscarProductos,
  ETIQUETA_CATEGORIA,
  obtenerPrincipio,
  principiosPorTipo,
  type CategoriaProducto,
} from "@/lib/productos";

export interface SeleccionProducto {
  principioId: string | null;
  comercial: string | null;
}

interface Props {
  tipo: ProductType;
  onTipo: (tipo: ProductType) => void;
  seleccion: SeleccionProducto;
  onSeleccion: (seleccion: SeleccionProducto) => void;
}

const CLASE_SELECT =
  "neo-input-sunken min-h-11 w-full rounded-xl px-3 text-[18px] text-tinta outline-none focus:border-pizarra disabled:opacity-50";

/**
 * Selector en cascada: Tipo de producto → Principio activo → Nombre comercial,
 * con búsqueda por nombre que completa los tres niveles de una vez.
 * El tipo alimenta al motor (rain-fastness); los otros dos niveles documentan
 * qué se va a aplicar.
 */
export default function SelectorProducto({ tipo, onTipo, seleccion, onSeleccion }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const resultados = buscarProductos(busqueda);
  const principio = seleccion.principioId ? obtenerPrincipio(seleccion.principioId) : null;
  const disponibles = principiosPorTipo(tipo);
  const categorias: CategoriaProducto[] = ["herbicida", "insecticida", "fungicida"];

  const cambiarTipo = (nuevo: ProductType) => {
    onTipo(nuevo);
    if (principio && principio.tipo !== nuevo) {
      onSeleccion({ principioId: null, comercial: null });
    }
  };

  const elegirResultado = (principioId: string, comercial: string | null) => {
    const elegido = obtenerPrincipio(principioId);
    if (elegido && elegido.tipo !== tipo) onTipo(elegido.tipo);
    onSeleccion({ principioId, comercial });
    setBusqueda("");
  };

  return (
    <section aria-label="Producto a aplicar" className="shadow-extruded rounded-xl bg-white p-4">
      {/* Nivel 1: tipo de producto (alimenta al motor) */}
      <div
        role="group"
        aria-label="Tipo de producto"
        className="shadow-sunken grid grid-cols-2 gap-1 rounded-xl bg-[#dae2fd] p-1"
      >
        {(["sistemico", "contacto"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tipo === t}
            onClick={() => cambiarTipo(t)}
            className={`min-h-11 rounded-lg text-[18px] font-bold transition-all active:scale-[0.98] ${
              tipo === t ? "shadow-extruded-sm bg-white text-pizarra" : "text-tinta"
            }`}
          >
            {t === "sistemico" ? "Sistémico" : "Contacto"}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[14px] text-tinta/60">
        Un producto de contacto necesita más horas sin lluvia: la misma hora puede
        cambiar de estado al cambiar el tipo.
      </p>

      {/* Búsqueda por nombre: completa los tres niveles de una vez */}
      <div className="relative mt-3">
        <label className="block">
          <span className="mb-1 block text-[18px] font-semibold">Buscar producto</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej.: Roundup, glifosato, Karate…"
            className={CLASE_SELECT}
          />
        </label>
        {resultados.length > 0 ? (
          <ul className="shadow-extruded absolute z-10 mt-1 w-full overflow-hidden rounded-xl bg-white">
            {resultados.map((r) => (
              <li key={`${r.principio.id}·${r.comercial ?? ""}`}>
                <button
                  type="button"
                  onClick={() => elegirResultado(r.principio.id, r.comercial)}
                  className="flex min-h-11 w-full flex-col justify-center px-3 py-1.5 text-left"
                >
                  <span className="text-[18px] font-semibold">
                    {r.comercial ?? r.principio.nombre}
                  </span>
                  <span className="text-[14px] text-tinta/60">
                    {r.comercial ? `${r.principio.nombre} · ` : ""}
                    {ETIQUETA_CATEGORIA[r.principio.categoria].toLowerCase().slice(0, -1)} ·{" "}
                    {r.principio.tipo === "sistemico" ? "sistémico" : "contacto"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {busqueda.trim().length >= 2 && resultados.length === 0 ? (
          <p className="mt-1 text-[16px] text-tinta/60">
            Sin coincidencias en el catálogo. Podés escribir el nombre a mano al registrar.
          </p>
        ) : null}
      </div>

      {/* Nivel 2: principio activo */}
      <label className="mt-3 block">
        <span className="mb-1 block text-[18px] font-semibold">Principio activo</span>
        <select
          value={seleccion.principioId ?? ""}
          onChange={(e) =>
            onSeleccion({ principioId: e.target.value || null, comercial: null })
          }
          className={CLASE_SELECT}
        >
          <option value="">Elegir principio activo…</option>
          {categorias.map((categoria) => {
            const delGrupo = disponibles.filter((p) => p.categoria === categoria);
            if (delGrupo.length === 0) return null;
            return (
              <optgroup key={categoria} label={ETIQUETA_CATEGORIA[categoria]}>
                {delGrupo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </label>

      {/* Nivel 3: nombre comercial */}
      <label className="mt-3 block">
        <span className="mb-1 block text-[18px] font-semibold">Nombre comercial</span>
        <select
          value={seleccion.comercial ?? ""}
          onChange={(e) =>
            onSeleccion({ principioId: seleccion.principioId, comercial: e.target.value || null })
          }
          disabled={!principio}
          className={CLASE_SELECT}
        >
          <option value="">
            {principio ? "Elegir nombre comercial…" : "Primero elegí el principio activo"}
          </option>
          {(principio?.comerciales ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
