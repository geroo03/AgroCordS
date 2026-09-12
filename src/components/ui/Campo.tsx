"use client";

import type { InputHTMLAttributes } from "react";

export default function Campo({
  etiqueta,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-base font-semibold">{etiqueta}</span>
      <input
        className="min-h-11 w-full rounded-lg border border-niebla bg-papel px-3 text-base outline-none focus:border-pizarra"
        {...props}
      />
    </label>
  );
}
