"use client";

import { usePathname } from "next/navigation";
import BarraNavegacion from "./BarraNavegacion";
import BotonSesion from "./BotonSesion";

/** Pantallas previas a entrar a la app: sin barra de navegación inferior. */
const RUTAS_SIN_NAV = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sinNav = RUTAS_SIN_NAV.includes(pathname);

  return (
    <>
      <main
        className={`lienzo-foto relative mx-auto w-full max-w-[480px] ${sinNav ? "min-h-dvh" : "min-h-dvh pb-24"}`}
      >
        {sinNav ? null : (
          <div className="fixed inset-x-0 top-0 z-40 mx-auto flex w-full max-w-[480px] justify-end px-4 pt-3">
            <BotonSesion />
          </div>
        )}
        {children}
      </main>
      {sinNav ? null : <BarraNavegacion />}
    </>
  );
}
