"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import IconoClay from "./IconoClay";
import {
  GlifoAjustes,
  GlifoHistorial,
  GlifoLotes,
  GlifoVentanas,
} from "./iconos/Glifos";

const PESTANAS = [
  { href: "/lotes", etiqueta: "Lotes", Icono: GlifoLotes },
  { href: "/ventanas", etiqueta: "Ventanas", Icono: GlifoVentanas },
  { href: "/historial", etiqueta: "Historial", Icono: GlifoHistorial },
  { href: "/ajustes", etiqueta: "Ajustes", Icono: GlifoAjustes },
] as const;

/**
 * Barra de pestañas inferior, neomórfica y fija. Cada ícono lleva su
 * etiqueta de texto al lado siempre — nunca reemplaza a la palabra — y la
 * pestaña activa se distingue por tres señales a la vez (insignia azul
 * rellena, peso de la letra y color), no sólo por el color.
 */
export default function BarraNavegacion() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones"
      className="clay-elevado fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4">
        {PESTANAS.map(({ href, etiqueta, Icono }) => {
          const activa = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activa ? "page" : undefined}
              className="flex min-h-16 flex-col items-center justify-center gap-1 py-2"
            >
              <IconoClay tono={activa ? "azul" : "neutro"} tamano="sm">
                <Icono />
              </IconoClay>
              <span
                className={`text-xs ${
                  activa ? "font-bold text-pizarra" : "font-semibold text-tinta/60"
                }`}
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
