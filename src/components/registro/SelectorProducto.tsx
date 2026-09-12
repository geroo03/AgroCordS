"use client";

import { useRef, useState } from "react";
import type { ProductType } from "@/lib/spray-engine";
import {
  buscarProductos,
  ETIQUETA_CATEGORIA,
  obtenerPrincipio,
} from "@/lib/productos";

/** Lo que se va a aplicar. `principioId` es null si no está en el catálogo. */
export interface SeleccionProducto {
  /** Texto que se muestra y que queda guardado al registrar la aplicación. */
  nombre: string;
  principioId: string | null;
}

interface Props {
  tipo: ProductType;
  onTipo: (tipo: ProductType) => void;
  seleccion: SeleccionProducto;
  onSeleccion: (seleccion: SeleccionProducto) => void;
}

const HORAS_SIN_LLUVIA: Record<ProductType, string> = {
  sistemico: "necesita 1 h sin lluvia",
  contacto: "necesita 4 h sin lluvia",
};

const ETIQUETA_TIPO: Record<ProductType, string> = {
  sistemico: "Sistémico",
  contacto: "Contacto",
};

/**
 * Un solo campo para elegir el producto.
 *
 * Antes eran cuatro controles —tipo, buscador, principio activo y nombre
 * comercial— que pedían por separado cosas que el catálogo ya relaciona. Acá
 * se escribe una vez: el buscador resuelve principio activo, nombre comercial
 * y **tipo**, porque `productos.ts` guarda el tipo de cada principio. El tipo
 * pasó de ser una pregunta a ser un dato derivado que se muestra como
 * consecuencia.
 *
 * La excepción es un producto que no está en el catálogo, que es curado y no
 * exhaustivo: ahí no hay de dónde derivar el tipo, y como el motor lo usa
 * para la ventana libre de lluvia, se pregunta. Suponer "sistémico" en
 * silencio sería elegir el supuesto MENOS conservador (1 h en vez de 4) y
 * podría dar por buena una hora que no lo es.
 */
export default function SelectorProducto({
  tipo,
  onTipo,
  seleccion,
  onSeleccion,
}: Props) {
  const [texto, setTexto] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  const resultados = buscarProductos(texto);
  const principio = seleccion.principioId ? obtenerPrincipio(seleccion.principioId) : null;
  const elegido = seleccion.nombre.length > 0;

  const elegirDelCatalogo = (principioId: string, comercial: string | null) => {
    const p = obtenerPrincipio(principioId);
    if (!p) return;
    // El tipo viaja con el producto: no se vuelve a preguntar.
    onTipo(p.tipo);
    onSeleccion({ nombre: comercial ?? p.nombre, principioId });
    setTexto("");
  };

  const usarTextoLibre = () => {
    const nombre = texto.trim();
    if (nombre.length === 0) return;
    onSeleccion({ nombre: nombre.slice(0, 120), principioId: null });
    setTexto("");
  };

  const limpiar = () => {
    onSeleccion({ nombre: "", principioId: null });
    setTexto("");
    entrada.current?.focus();
  };

  if (elegido) {
    return (
      <section aria-label="Producto a aplicar" className="mt-5">
        <h2 className="text-lg font-bold">Producto a aplicar</h2>
        <div className="mt-2 rounded-xl border border-niebla p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold">{seleccion.nombre}</p>
              <p className="mt-0.5 text-sm text-tinta/70">
                {principio
                  ? `${principio.nombre} · ${ETIQUETA_CATEGORIA[principio.categoria]
                      .toLowerCase()
                      .slice(0, -1)} · ${ETIQUETA_TIPO[tipo].toLowerCase()}`
                  : "No está en el catálogo"}
              </p>
              <p className="mt-1 text-sm text-tinta/70">
                {ETIQUETA_TIPO[tipo]}: {HORAS_SIN_LLUVIA[tipo]}.
              </p>
            </div>
            <button
              type="button"
              onClick={limpiar}
              className="flex min-h-11 shrink-0 items-center text-sm font-semibold text-pizarra underline"
            >
              Cambiar
            </button>
          </div>

          {/* Sólo cuando no hay catálogo del que derivarlo. */}
          {!principio ? (
            <div className="mt-3 border-t border-niebla pt-3">
              <p className="text-sm font-semibold">¿Es sistémico o de contacto?</p>
              <p className="mt-0.5 text-xs text-tinta/60">
                Define cuántas horas sin lluvia necesita, y con eso cambia la
                evaluación de cada hora.
              </p>
              <div
                role="group"
                aria-label="Tipo de producto"
                className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-niebla p-1"
              >
                {(["sistemico", "contacto"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tipo === t}
                    onClick={() => onTipo(t)}
                    className={`min-h-11 rounded-md text-base font-semibold transition-colors duration-200 ${
                      tipo === t ? "bg-pizarra text-white" : "text-tinta"
                    }`}
                  >
                    {ETIQUETA_TIPO[t]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Producto a aplicar" className="mt-5">
      <h2 className="text-lg font-bold">Producto a aplicar</h2>
      <div className="relative mt-2">
        <label className="block">
          <span className="sr-only">Buscar o escribir el producto</span>
          <input
            ref={entrada}
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const primero = resultados[0];
              if (primero) elegirDelCatalogo(primero.principio.id, primero.comercial);
              else usarTextoLibre();
            }}
            placeholder="Marca o principio activo: Roundup, glifosato…"
            className="min-h-11 w-full rounded-lg border border-niebla bg-papel px-3 text-base outline-none focus:border-pizarra"
          />
        </label>

        {resultados.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-niebla bg-papel shadow-lg">
            {resultados.map((r) => (
              <li key={`${r.principio.id}·${r.comercial ?? ""}`}>
                <button
                  type="button"
                  onClick={() => elegirDelCatalogo(r.principio.id, r.comercial)}
                  className="flex min-h-11 w-full flex-col justify-center px-3 py-1.5 text-left"
                >
                  <span className="text-base font-semibold">
                    {r.comercial ?? r.principio.nombre}
                  </span>
                  <span className="text-xs text-tinta/60">
                    {r.comercial ? `${r.principio.nombre} · ` : ""}
                    {ETIQUETA_CATEGORIA[r.principio.categoria].toLowerCase().slice(0, -1)} ·{" "}
                    {ETIQUETA_TIPO[r.principio.tipo].toLowerCase()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {texto.trim().length >= 2 && resultados.length === 0 ? (
        <div className="mt-2 rounded-lg bg-niebla/60 p-3">
          <p className="text-sm">
            No está en el catálogo, que cubre los de uso más extendido pero no es
            el registro completo de SENASA.
          </p>
          <button
            type="button"
            onClick={usarTextoLibre}
            className="mt-1 flex min-h-11 items-center text-sm font-semibold text-pizarra underline"
          >
            Usar &ldquo;{texto.trim()}&rdquo; igual
          </button>
        </div>
      ) : null}
    </section>
  );
}
