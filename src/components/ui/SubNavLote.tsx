"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Las 4 secciones de un lote. Siempre se muestran las 4, en el mismo orden. */
function opciones(loteId: string) {
  return [
    { href: `/lotes/${loteId}`, etiqueta: "Detalle" },
    { href: `/lotes/${loteId}/ndvi`, etiqueta: "NDVI" },
    { href: `/lotes/${loteId}/riesgo`, etiqueta: "Riesgo" },
    { href: `/lotes/${loteId}/historial`, etiqueta: "Historial" },
  ] as const;
}

/**
 * Sub-navegación de las 4 secciones de un lote. La pestaña activa queda
 * "presionada" (fondo hundido) mientras se está en esa ruta, y vuelve a su
 * estado normal recién cuando se navega a otra pestaña.
 */
export default function SubNavLote({ loteId }: { loteId: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones del lote"
      className="shadow-sunken grid grid-cols-4 gap-1 rounded-xl bg-[#dae2fd] p-1"
    >
      {opciones(loteId).map((o) => {
        const activa = pathname === o.href;
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={activa ? "page" : undefined}
            className={`flex h-10 items-center justify-center rounded-lg px-1 text-center text-[14px] font-bold tracking-wide transition-all active:scale-95 ${
              activa ? "shadow-extruded-sm bg-white text-pizarra" : "text-tinta/70"
            }`}
          >
            {o.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
