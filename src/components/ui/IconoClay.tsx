import type { ReactNode } from "react";

type TonoClay = "azul" | "neutro";
type TamanoClay = "sm" | "md" | "lg";

const MEDIDA: Record<TamanoClay, string> = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

const MEDIDA_GLIFO: Record<TamanoClay, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

/**
 * Insignia "clay": una superficie blanda y redondeada con sombra suave y un
 * brillo interior, para que cada ícono se lea como un objeto táctil y no
 * como una línea plana — el claymorfismo que pide el diseño, aplicado sobre
 * dibujos explícitos para reconocerse de un vistazo.
 *
 * El tono queda siempre dentro de blanco/gris/azul: nunca reutiliza verde,
 * ámbar o rojo, que son del veredicto de pulverización y de nadie más.
 */
export default function IconoClay({
  children,
  tono = "neutro",
  tamano = "md",
}: {
  children: ReactNode;
  tono?: TonoClay;
  tamano?: TamanoClay;
}) {
  return (
    <span
      aria-hidden
      className={`clay-insignia inline-flex shrink-0 items-center justify-center rounded-2xl ${MEDIDA[tamano]} ${
        tono === "azul" ? "clay-tono-azul" : "clay-tono-neutro"
      }`}
    >
      <span className={MEDIDA_GLIFO[tamano]}>{children}</span>
    </span>
  );
}
