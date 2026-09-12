"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import IconoClay from "./IconoClay";
import { GlifoHistorial, GlifoLotes, GlifoVentanas } from "./iconos/Glifos";

const PESTANAS = [
  { href: "/lotes", etiqueta: "Lotes", Icono: GlifoLotes },
  { href: "/ventanas", etiqueta: "Ventanas", Icono: GlifoVentanas },
  { href: "/historial", etiqueta: "Historial", Icono: GlifoHistorial },
] as const;

/**
 * Barra de pestañas inferior, neomórfica y fija. Cada ícono lleva su
 * etiqueta de texto al lado siempre — nunca reemplaza a la palabra — y la
 * pestaña activa se distingue por tres señales a la vez (tarjeta hundida,
 * insignia azul rellena y peso de la letra), no sólo por el color.
 */
export default function BarraNavegacion() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones"
      className="clay-elevado fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] rounded-t-3xl px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-3 gap-1.5">
        {PESTANAS.map(({ href, etiqueta, Icono }) => {
          const activa = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activa ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all active:scale-[0.98] ${
                activa ? "clay-hundido" : ""
              }`}
            >
              <IconoClay tono={activa ? "azul" : "neutro"} tamano="sm">
                <Icono />
              </IconoClay>
              <span
                className={`text-xs ${activa ? "font-bold text-pizarra" : "font-semibold text-tinta/60"}`}
              >
                {etiqueta}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
