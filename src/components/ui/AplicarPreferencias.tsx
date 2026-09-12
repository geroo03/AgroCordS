"use client";

import { useEffect } from "react";
import { aplicarPreferencias, leerPreferencias } from "@/lib/preferencias";

/**
 * Aplica la tipografía y el tamaño guardados apenas carga la app. Vive en el
 * layout raíz, así que corre una sola vez por sesión, no en cada pantalla.
 */
export default function AplicarPreferencias() {
  useEffect(() => {
    aplicarPreferencias(leerPreferencias());
  }, []);
  return null;
}
