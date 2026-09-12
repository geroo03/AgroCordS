"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cerrarSesion, obtenerSesion } from "@/lib/sesion";

/**
 * Botón de perfil, visible en cualquier pantalla principal mientras haya
 * una sesión iniciada (llegaste por el login, no por "Seguir sin cuenta").
 * Permite desconectarse en cualquier momento, sin tener que buscar un menú.
 */
export default function BotonSesion() {
  const router = useRouter();
  // Inicializador perezoso en vez de useEffect: en el server `obtenerSesion()`
  // ya devuelve null (sin window), así que el valor real llega en el primer
  // render del cliente sin parpadeo ni setState post-montaje.
  const [email] = useState<string | null>(() => obtenerSesion());
  const [abierto, setAbierto] = useState(false);

  if (!email) return null;

  const desconectar = () => {
    cerrarSesion();
    setAbierto(false);
    router.push("/login");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="true"
        title="Perfil y sesión"
        className="shadow-extruded-sm flex h-10 w-10 items-center justify-center rounded-full bg-pizarra text-white transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined text-[20px]">person</span>
      </button>

      {abierto ? (
        <>
          {/* Backdrop: cierra el menú al tocar afuera. */}
          <button
            type="button"
            aria-label="Cerrar menú de perfil"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="shadow-extruded absolute top-12 right-0 z-40 w-64 rounded-xl bg-white p-4">
            <p className="text-[13px] font-semibold text-[#444651]">Conectado como</p>
            <p className="truncate text-[16px] font-bold text-tinta">{email}</p>
            <button
              type="button"
              onClick={desconectar}
              className="neo-btn-secondary mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-bloqueo transition-transform active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Cerrar sesión
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
