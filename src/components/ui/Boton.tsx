"use client";

import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario";

export default function Boton({
  variante = "primario",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  const base =
    "min-h-11 rounded-xl px-4 text-[18px] font-bold tracking-wide transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";
  const estilos =
    variante === "primario"
      ? "neo-btn-primary text-white"
      : "neo-btn-secondary text-pizarra";
  return <button className={`${base} ${estilos} ${className}`} {...props} />;
}
