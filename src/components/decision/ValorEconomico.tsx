import type { ValorDecision } from "@/lib/riesgo";

/**
 * Traduce el veredicto meteorológico a pesos: cuánto representa aplicar
 * ahora contra esperar la mejor ventana. Es el puente hacia el módulo de
 * riesgo/manejo (`/lotes/[id]/riesgo`), no una decisión nueva — el color y
 * el texto acompañan al veredicto, nunca lo contradicen.
 */
export default function ValorEconomico({ valor }: { valor: ValorDecision | null }) {
  if (!valor) return null;

  if (valor.tipo === "aplicacion_eficiente") {
    return (
      <div className="shadow-sunken mt-3 rounded-xl bg-[#f2f3ff] p-3 text-[16px]">
        <p className="font-semibold text-optima">Sin pérdida de eficiencia estimada</p>
        <p className="mt-0.5 text-tinta/80">{valor.mensaje}</p>
      </div>
    );
  }

  return (
    <div className="shadow-sunken mt-3 rounded-xl bg-[#fff6e9] p-3 text-[16px]">
      <p className="font-semibold text-marginal tabular-nums">
        ~${valor.montoArs.toLocaleString("es-AR")} en juego
      </p>
      <p className="mt-0.5 text-tinta/80">{valor.mensaje}</p>
    </div>
  );
}
