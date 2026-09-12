"use client";

import type { InputHTMLAttributes } from "react";

export default function Campo({
  etiqueta,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[18px] font-semibold">{etiqueta}</span>
      <input
        className="neo-input-sunken min-h-11 w-full rounded-xl px-3 text-[18px] text-tinta outline-none focus:border-pizarra"
        {...props}
      />
    </label>
  );
}
