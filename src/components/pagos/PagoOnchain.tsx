"use client";

import { useState } from "react";
import Boton from "@/components/ui/Boton";
import {
  direccionDestino,
  direccionToken,
  montoDemo,
  pagosConfigurados,
  redConfigurada,
  tokensDisponibles,
  type ComprobantePago,
  type SimboloStablecoin,
} from "@/lib/pagos";
import { asegurarRed, conectarWallet, enviarPago, hayWalletInyectada } from "@/lib/pagos/wallet";

type Fase =
  | "inicial"
  | "conectando"
  | "enviando"
  | "esperando_firma_rechazada"
  | "verificando"
  | "verificado"
  | "error";

interface Props {
  onVerificado: () => void;
}

function acortar(direccion: string): string {
  return `${direccion.slice(0, 6)}…${direccion.slice(-4)}`;
}

/**
 * Pago real onchain con una stablecoin de Twin Finance (ARGt/BRAt sobre
 * Base) para desbloquear Premium. Interacción genuina: la wallet del usuario
 * firma y transmite una transferencia real, y el servidor la verifica contra
 * el RPC público de Base antes de aceptarla — nada de esto se simula.
 *
 * Si el entorno no tiene contrato/destino configurados, no se renderiza
 * nada: `Paywall.tsx` sigue funcionando sólo con la activación de demo, que
 * ya existía.
 */
export default function PagoOnchain({ onVerificado }: Props) {
  const [moneda, setMoneda] = useState<SimboloStablecoin | null>(
    () => tokensDisponibles()[0] ?? null,
  );
  const [fase, setFase] = useState<Fase>("inicial");
  const [cuenta, setCuenta] = useState<`0x${string}` | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<ComprobantePago | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!pagosConfigurados() || !moneda) return null;

  const monto = montoDemo();
  const destino = direccionDestino();
  const contrato = direccionToken(moneda);

  const pagar = async () => {
    if (!destino || !contrato) return;
    setError(null);
    try {
      setFase("conectando");
      const cuentaConectada = cuenta ?? (await conectarWallet());
      setCuenta(cuentaConectada);
      await asegurarRed(redConfigurada());

      setFase("enviando");
      const txHash = await enviarPago({
        contrato,
        destino,
        desde: cuentaConectada,
        montoHumano: monto,
      });
      setHash(txHash);

      setFase("verificando");
      const resultado = await verificarConReintentos(txHash, moneda);
      setComprobante(resultado);
      if (resultado.estado === "verificado") {
        setFase("verificado");
        onVerificado();
      } else {
        setFase("error");
        setError(resultado.mensaje);
      }
    } catch (err) {
      setFase("error");
      setError(mensajeDeError(err));
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-niebla p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <span aria-hidden>🛰️💵</span> Pagar con {moneda} (onchain real · {networkLabel()})
      </p>
      <p className="mt-1 text-xs text-tinta/60">
        {monto} {moneda} a la wallet de demostración. Tu wallet firma la transacción; el
        servidor la verifica leyendo la red Base, no confía en el navegador.
      </p>

      {fase === "verificado" && comprobante ? (
        <div className="mt-3 rounded-lg bg-optima/10 p-3 text-sm">
          <p className="font-semibold text-optima">Pago verificado onchain ✓</p>
          <p className="mt-1 text-tinta/70">
            {comprobante.monto} {comprobante.moneda} · bloque {comprobante.bloque}
          </p>
          {comprobante.explorerUrl ? (
            <a
              href={comprobante.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all font-semibold text-pizarra underline"
            >
              Ver transacción en el explorer
            </a>
          ) : null}
        </div>
      ) : (
        <>
          {tokensDisponibles().length > 1 ? (
            <div className="mt-2 flex gap-2">
              {tokensDisponibles().map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMoneda(s)}
                  aria-pressed={moneda === s}
                  className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${
                    moneda === s ? "border-pizarra bg-pizarra text-white" : "border-niebla"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <Boton
            onClick={pagar}
            disabled={
              !hayWalletInyectada() ||
              fase === "conectando" ||
              fase === "enviando" ||
              fase === "verificando"
            }
            className="mt-3 w-full"
          >
            {fase === "conectando"
              ? "Conectando wallet…"
              : fase === "enviando"
                ? "Confirmá en tu wallet…"
                : fase === "verificando"
                  ? "Verificando en Base…"
                  : !hayWalletInyectada()
                    ? "Instalá una wallet para pagar onchain"
                    : cuenta
                      ? `Pagar ${monto} ${moneda} (${acortar(cuenta)})`
                      : `Conectar wallet y pagar ${monto} ${moneda}`}
          </Boton>

          {hash && fase !== "verificado" ? (
            <p className="mt-2 truncate text-xs text-tinta/60">Transacción: {hash}</p>
          ) : null}

          {error ? (
            <div className="mt-2 flex items-center justify-between gap-2 text-sm text-bloqueo">
              <span>{error}</span>
              {hash ? (
                <button
                  type="button"
                  onClick={async () => {
                    setFase("verificando");
                    setError(null);
                    const resultado = await verificarConReintentos(hash, moneda);
                    setComprobante(resultado);
                    if (resultado.estado === "verificado") {
                      setFase("verificado");
                      onVerificado();
                    } else {
                      setFase("error");
                      setError(resultado.mensaje);
                    }
                  }}
                  className="shrink-0 font-semibold underline"
                >
                  Reintentar
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function networkLabel(): string {
  return redConfigurada() === "base" ? "Base" : "Base Sepolia";
}

async function verificarConReintentos(
  hash: string,
  moneda: SimboloStablecoin,
  intentos = 5,
): Promise<ComprobantePago> {
  for (let i = 0; i < intentos; i++) {
    const respuesta = await fetch("/api/pagos/verificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash, moneda }),
    });
    const datos = (await respuesta.json()) as ComprobantePago;
    // "no_encontrado" es transitorio apenas se transmite la tx: reintentamos
    // con backoff antes de mostrarlo como error.
    if (datos.estado !== "no_encontrado" || i === intentos - 1) return datos;
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error("No se pudo verificar el pago.");
}

function mensajeDeError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("User rejected") || err.message.includes("rechaz")) {
      return "Cancelaste la transacción en la wallet.";
    }
    return err.message;
  }
  return "No pudimos completar el pago onchain.";
}
