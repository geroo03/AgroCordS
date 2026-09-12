/**
 * Glifos de línea, 24×24, un solo color heredado (`stroke="currentColor"`).
 * Cada uno vive siempre dentro de una <IconoClay>, que aporta el color y el
 * relieve; acá sólo el dibujo, deliberadamente simple para leerse de un
 * vistazo incluso al tamaño chico de la barra de navegación.
 */

import type { SVGProps } from "react";

const BASE: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-full w-full",
  "aria-hidden": true,
};

export function GlifoLotes() {
  return (
    <svg {...BASE}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  );
}

export function GlifoVentanas() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function GlifoHistorial() {
  return (
    <svg {...BASE}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3.5 6h.01" />
      <path d="M3.5 12h.01" />
      <path d="M3.5 18h.01" />
    </svg>
  );
}

export function GlifoAjustes() {
  return (
    <svg {...BASE}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.1" />
      <circle cx="9" cy="17" r="2.1" />
    </svg>
  );
}

/** Aplicación: un rociador con la nube de pulverización saliendo. */
export function GlifoAplicacion() {
  return (
    <svg {...BASE}>
      <rect x="9" y="9" width="6" height="11" rx="1.5" />
      <path d="M11 9V6h2v3" />
      <path d="M13.5 6l3-2.2M13.5 5.6l3.6.4M13 4l2.6-2" />
    </svg>
  );
}

/** Agua y estrés: la gota clásica. */
export function GlifoAgua() {
  return (
    <svg {...BASE}>
      <path d="M12 3c-4 5-7 8.7-7 12a7 7 0 0 0 14 0c0-3.3-3-7-7-12z" />
    </svg>
  );
}

/** Riesgo climático: un copo de nieve, símbolo directo de frío/helada. */
export function GlifoClima() {
  return (
    <svg {...BASE}>
      <path d="M12 2v20M3 7l18 10M21 7L3 17" />
      <path d="M12 2l-2.3 2.3M12 2l2.3 2.3M12 22l-2.3-2.3M12 22l2.3-2.3" />
      <path d="M3 7l2.9.6M3 7l.6 2.9M21 17l-2.9-.6M21 17l-.6-2.9M21 7l-2.9.6M21 7l-.6 2.9M3 17l2.9-.6M3 17l-.6-2.9" />
    </svg>
  );
}

/** Estado del cultivo: una hoja con su nervadura. */
export function GlifoCultivo() {
  return (
    <svg {...BASE}>
      <path d="M20 4C10 4 4 10 4 18c0 .5 0 1 .1 1.5C10 18 16 13 20 4z" />
      <path d="M5 19c4-4 9-9 13-13" />
    </svg>
  );
}

/** Contexto de temporada: sol y nube, lectura directa de "clima general". */
export function GlifoContexto() {
  return (
    <svg {...BASE}>
      <circle cx="16" cy="7.5" r="3" />
      <path d="M16 2.7v1.3M20.3 7.5H19M13.4 4.6l.9.9M19.7 4.6l-.9.9" />
      <path d="M5 19a3.4 3.4 0 0 1-.4-6.8 4.4 4.4 0 0 1 8.4-1.7 3.4 3.4 0 0 1 3.7 5.3A2.9 2.9 0 0 1 15.9 19H5z" />
    </svg>
  );
}

/** Correo: sobre cerrado. Para el login por magic link. */
export function GlifoCorreo() {
  return (
    <svg {...BASE}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

/** Correo ya abierto/leído: mismo sobre, con el tilde de confirmación. */
export function GlifoCorreoAbierto() {
  return (
    <svg {...BASE}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  );
}

/** Continuar/enviar: flecha simple hacia la derecha. */
export function GlifoFlechaDerecha() {
  return (
    <svg {...BASE}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Reintentar/reenviar: flecha circular. */
export function GlifoRefrescar() {
  return (
    <svg {...BASE}>
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

/** Alerta: signo de exclamación dentro de un triángulo. */
export function GlifoAlerta() {
  return (
    <svg {...BASE}>
      <path d="M12 3 2 20h20L12 3z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/** Perfil de usuario: cabeza y hombros, para el botón de sesión. */
export function GlifoPersona() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}

/** Cerrar sesión: puerta con flecha de salida. */
export function GlifoSalir() {
  return (
    <svg {...BASE}>
      <path d="M15 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
      <path d="M11 12h10M17 8l4 4-4 4" />
    </svg>
  );
}
