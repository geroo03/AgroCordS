"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Las 5 secciones de un lote. Siempre se muestran las 5, en el mismo orden.
 * "Detalle" es la pantalla de decisión (veredicto + diagnóstico); las otras
 * cuatro son las vistas que ya existían en el encabezado de esa pantalla.
 */
function opciones(loteId: string) {
  return [
    { href: `/lotes/${loteId}`, etiqueta: "Detalle" },
    { href: `/lotes/${loteId}/ndvi`, etiqueta: "NDVI" },
    { href: `/lotes/${loteId}/riesgo`, etiqueta: "Riesgo" },
    { href: `/lotes/${loteId}/agronomico`, etiqueta: "Agro" },
    { href: `/lotes/${loteId}/historial`, etiqueta: "Historial" },
  ] as const;
}

/**
 * Sub-navegación de las 5 secciones de un lote. La pestaña activa queda
 * "hundida" mientras se está en esa ruta exacta, y vuelve a su estado normal
 * recién cuando se navega a otra pestaña.
 */
export default function SubNavLote({ loteId }: { loteId: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones del lote"
      className="clay-hundido -mx-1 grid grid-cols-5 gap-1 overflow-x-auto rounded-xl p-1"
    >
      {opciones(loteId).map((o) => {
        const activa = pathname === o.href;
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={activa ? "page" : undefined}
            className={`flex h-10 items-center justify-center rounded-lg px-1 text-center text-xs font-bold tracking-wide transition-all active:scale-95 ${
              activa ? "clay-elevado text-pizarra" : "text-tinta/70"
            }`}
          >
            {o.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
