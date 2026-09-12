"use client";

import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario";

export default function Boton({
  variante = "primario",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  const base =
    "min-h-11 rounded-lg px-4 text-base font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const estilos =
    variante === "primario"
      ? "bg-pizarra text-white"
      : "border border-niebla bg-papel text-tinta";
  return <button className={`${base} ${estilos} ${className}`} {...props} />;
}
