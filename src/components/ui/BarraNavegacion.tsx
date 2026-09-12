"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { href: "/lotes", etiqueta: "Lotes", icono: "grid_view" },
  { href: "/ventanas", etiqueta: "Ventanas", icono: "water_drop" },
  { href: "/historial", etiqueta: "Historial", icono: "history" },
] as const;

/** Barra de pestañas inferior, fija, estilo app móvil con relieve neumórfico. */
export default function BarraNavegacion() {
  const pathname = usePathname();

  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl bg-[#faf8ff]/95 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(160,175,200,0.22)] backdrop-blur-xl">
      <div className="px-4 pb-2">
        <div className="shadow-sunken flex items-start gap-2 rounded-lg bg-[#f2f3ff] px-3 py-1.5">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#757682]">
            gavel
          </span>
          <p className="text-[14px] leading-tight text-[#444651]">
            <strong className="font-semibold text-tinta">AVISO LEGAL:</strong> Condiciones
            estimadas. No reemplaza receta agronómica oficial.
          </p>
        </div>
      </div>

      <nav aria-label="Secciones" className="px-4">
        <div className="flex items-center justify-between gap-3">
          {PESTANAS.map((p) => {
            const activa = pathname === p.href || pathname.startsWith(`${p.href}/`);
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={activa ? "page" : undefined}
                className={`flex h-20 flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-[0.98] ${
                  activa
                    ? "shadow-sunken bg-[#dae2fd] font-bold text-pizarra"
                    : "shadow-extruded bg-[#eaedff] text-[#444651]"
                }`}
              >
                <span
                  className={`clay-token clay-token--pizarra flex h-11 w-11 items-center justify-center transition-transform ${
                    activa ? "scale-110" : "scale-95 opacity-90"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-pizarra text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {p.icono}
                  </span>
                </span>
                <span className="text-[15px] font-semibold tracking-wider uppercase">
                  {p.etiqueta}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </footer>
  );
}
