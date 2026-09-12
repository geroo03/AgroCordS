"use client";

import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario";

/**
 * Botón neomórfico: enorme, con margen generoso alrededor para que dos
 * botones vecinos nunca queden pegados y sea difícil tocar el equivocado.
 *
 * El primario es un relleno azul sólido, no la misma superficie que el
 * fondo: el neomorfismo de manual —mismo color, sólo sombra— es ilegible
 * para una acción principal, así que acá el contraste manda sobre la pureza
 * del estilo. El secundario sí usa el relieve (superficie clara que
 * sobresale del lienzo con sombra dual), con texto oscuro de alto contraste.
 */
export default function Boton({
  variante = "primario",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  const base =
    "min-h-14 rounded-2xl px-6 text-base font-bold tracking-tight transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";
  const estilos =
    variante === "primario" ? "clay-boton-primario text-white" : "clay-elevado text-tinta";
  return <button className={`${base} ${estilos} ${className}`} {...props} />;
}
