"use client";

import type { InputHTMLAttributes } from "react";

/**
 * Campo "hundido": en el lienzo neomórfico, una superficie que se ve
 * presionada es la lectura convencional de "acá se escribe". El relieve
 * queda en el fondo del campo; el texto y la etiqueta van en alto
 * contraste — el neomorfismo se aplica a la superficie, nunca a la letra.
 */
export default function Campo({
  etiqueta,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-bold text-tinta">{etiqueta}</span>
      <input
        className={`clay-hundido min-h-14 w-full rounded-2xl border-none px-4 text-base font-medium text-tinta outline-none placeholder:text-tinta/40 focus:ring-2 focus:ring-pizarra ${className}`}
        {...props}
      />
    </label>
  );
}
