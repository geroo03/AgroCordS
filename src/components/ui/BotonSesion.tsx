"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cerrarSesion, obtenerSesion } from "@/lib/sesion";
import IconoClay from "./IconoClay";
import { GlifoPersona, GlifoSalir } from "./iconos/Glifos";

/**
 * Botón de perfil, visible en cualquier pantalla principal mientras haya
 * una sesión iniciada (llegaste por el login, no por "Seguir sin cuenta").
 * Permite desconectarse en cualquier momento, sin tener que buscar un menú.
 */
export default function BotonSesion() {
  const router = useRouter();
  // Inicializador perezoso en vez de useEffect: en el server obtenerSesion()
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
      >
        <IconoClay tono="azul" tamano="sm">
          <GlifoPersona />
        </IconoClay>
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
          <div className="clay-elevado absolute top-12 right-0 z-40 w-64 rounded-2xl bg-papel p-4">
            <p className="text-xs font-semibold text-tinta/60">Conectado como</p>
            <p className="truncate text-base font-bold text-tinta">{email}</p>
            <button
              type="button"
              onClick={desconectar}
              className="clay-elevado mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-bloqueo transition-transform active:scale-[0.98]"
            >
              <span className="h-5 w-5">
                <GlifoSalir />
              </span>
              Cerrar sesión
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
