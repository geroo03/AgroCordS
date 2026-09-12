"use client";

import { usePathname } from "next/navigation";
import BarraNavegacion from "./BarraNavegacion";

/** Pantallas previas a entrar a la app: sin barra de navegación inferior. */
const RUTAS_SIN_NAV = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sinNav = RUTAS_SIN_NAV.includes(pathname);

  return (
    <>
      <main
        className={`bg-fondo relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col shadow-[0_0_32px_rgba(15,37,78,0.12)] ${
          sinNav ? "" : "pb-[var(--nav-height)]"
        }`}
      >
        {children}
      </main>
      {sinNav ? null : <BarraNavegacion />}
    </>
  );
}
