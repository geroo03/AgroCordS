"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  {
    href: "/lotes",
    etiqueta: "Lotes",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
        <path d="M9 4v14" />
        <path d="M15 6v14" />
      </svg>
    ),
  },
  {
    href: "/ventanas",
    etiqueta: "Ventanas",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    href: "/historial",
    etiqueta: "Historial",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3.5 6h.01" />
        <path d="M3.5 12h.01" />
        <path d="M3.5 18h.01" />
      </svg>
    ),
  },
] as const;

/** Barra de pestañas inferior, fija, estilo app móvil. */
export default function BarraNavegacion() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] border-t border-niebla bg-papel pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-3">
        {PESTANAS.map((p) => {
          const activa = pathname === p.href || pathname.startsWith(`${p.href}/`);
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={activa ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs ${
                activa ? "font-bold text-pizarra" : "font-medium text-tinta/55"
              }`}
            >
              {p.icono}
              {p.etiqueta}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
