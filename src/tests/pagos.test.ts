import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aMenorUnidad,
  aMontoLegible,
  codificarTransfer,
  decodificarTransferLog,
  SELECTOR_DECIMALS,
  TOPIC_TRANSFER,
} from "../lib/pagos/erc20";
import { direccionDestino, direccionToken } from "../lib/pagos/config";
import { verificarPago } from "../lib/pagos/verificarPago";

// Direcciones de prueba de 20 bytes exactos (40 hex): un largo incorrecto acá
// haría que `config.ts` las rechace silenciosamente como no configuradas.
const CONTRATO_ARGT = "0x1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a";
const DESTINO = "0x2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b";
const OTRO_CONTRATO = "0x3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c";
const OTRA_WALLET = "0x4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d";
const HASH_VALIDO = `0x${"a".repeat(64)}`;

/**
 * `BigInt` a partir de un string, no del sufijo literal `123n`: el `target`
 * de `tsconfig.json` es anterior a ES2020 y `next build` rechaza esa sintaxis
 * en el chequeo de tipos (aunque Vitest, con esbuild, la acepta en runtime).
 * Con string además se evita perder precisión en montos de 18 decimales que
 * exceden `Number.MAX_SAFE_INTEGER`.
 */
const bi = (texto: string): bigint => BigInt(texto);

function palabra(direccionOMonto: string, esDireccion: boolean): string {
  const limpio = direccionOMonto.replace(/^0x/, "");
  return esDireccion ? limpio.padStart(64, "0") : BigInt(direccionOMonto).toString(16).padStart(64, "0");
}

function logTransfer(contrato: string, desde: string, hacia: string, monto: bigint) {
  return {
    address: contrato,
    topics: [TOPIC_TRANSFER, `0x${palabra(desde, true)}`, `0x${palabra(hacia, true)}`],
    data: `0x${monto.toString(16).padStart(64, "0")}`,
  };
}

function respuestaJson(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** Mock de fetch para el RPC de Base: responde según el método JSON-RPC. */
function mockearRpc(opciones: {
  recibo?: unknown;
  decimalesHex?: string;
  fallaRed?: boolean;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      if (opciones.fallaRed) throw new TypeError("fetch failed");
      const cuerpo = JSON.parse(String(init?.body)) as { method: string };
      if (cuerpo.method === "eth_getTransactionReceipt") {
        return respuestaJson({ jsonrpc: "2.0", id: 1, result: opciones.recibo ?? null });
      }
      if (cuerpo.method === "eth_call") {
        return respuestaJson({ jsonrpc: "2.0", id: 1, result: opciones.decimalesHex ?? "0x12" });
      }
      return respuestaJson({ jsonrpc: "2.0", id: 1, result: null });
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_ARGT_CONTRATO", CONTRATO_ARGT);
  vi.stubEnv("NEXT_PUBLIC_PAGOS_DESTINO", DESTINO);
  vi.stubEnv("NEXT_PUBLIC_PAGOS_RED", "base-sepolia");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("codificación/decodificación ERC-20 (sin red)", () => {
  it("1. aMenorUnidad y aMontoLegible son inversas para un monto con decimales", () => {
    const menor = aMenorUnidad("12.5", 6);
    expect(menor).toBe(bi("12500000"));
    expect(aMontoLegible(menor, 6)).toBe("12.5");
  });

  it("2. aMenorUnidad rechaza texto que no es un número", () => {
    expect(() => aMenorUnidad("doce", 18)).toThrow();
  });

  it("3. codificarTransfer arma el selector, la dirección y el monto en 32 bytes cada uno", () => {
    const data = codificarTransfer(DESTINO as `0x${string}`, bi("1000000"));
    expect(data.slice(0, 10)).toBe("0xa9059cbb");
    expect(data.length).toBe(10 + 64 + 64);
    expect(data.slice(-64)).toBe((1_000_000).toString(16).padStart(64, "0"));
  });

  it("4. decodificarTransferLog encuentra el log del contrato esperado entre varios", () => {
    const logs = [
      logTransfer(OTRO_CONTRATO, OTRA_WALLET, DESTINO, bi("999")),
      logTransfer(CONTRATO_ARGT, OTRA_WALLET, DESTINO, bi("5000000")),
    ];
    const resultado = decodificarTransferLog(logs, CONTRATO_ARGT as `0x${string}`);
    expect(resultado?.monto).toBe(bi("5000000"));
    expect(resultado?.hacia.toLowerCase()).toBe(DESTINO.toLowerCase());
  });

  it("5. decodificarTransferLog devuelve null si el contrato no aparece", () => {
    const logs = [logTransfer(OTRO_CONTRATO, OTRA_WALLET, DESTINO, bi("999"))];
    expect(decodificarTransferLog(logs, CONTRATO_ARGT as `0x${string}`)).toBeNull();
  });
});

describe("verificarPago", () => {
  it("6. sin credenciales/configuración → no_configurado, sin llamar a la red", async () => {
    vi.unstubAllEnvs();
    const fetchEspiado = vi.fn();
    vi.stubGlobal("fetch", fetchEspiado);
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("no_configurado");
    expect(fetchEspiado).not.toHaveBeenCalled();
  });

  it("7. hash con formato inválido → hash_invalido, sin llamar a la red", async () => {
    const fetchEspiado = vi.fn();
    vi.stubGlobal("fetch", fetchEspiado);
    const r = await verificarPago({ hash: "0xno-es-un-hash", moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("hash_invalido");
    expect(fetchEspiado).not.toHaveBeenCalled();
  });

  it("8. transacción todavía no minada (recibo null) → no_encontrado", async () => {
    mockearRpc({ recibo: null });
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("no_encontrado");
  });

  it("9. transacción revertida (status 0x0) → transaccion_fallida", async () => {
    mockearRpc({ recibo: { status: "0x0", blockNumber: "0x10", logs: [] } });
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("transaccion_fallida");
  });

  it("10. transacción exitosa pero sin log Transfer del token configurado → token_incorrecto", async () => {
    mockearRpc({
      recibo: {
        status: "0x1",
        blockNumber: "0x10",
        logs: [logTransfer(OTRO_CONTRATO, OTRA_WALLET, DESTINO, bi("1000000000000000000"))],
      },
    });
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("token_incorrecto");
  });

  it("11. Transfer del token correcto pero a otra wallet → destino_incorrecto", async () => {
    mockearRpc({
      recibo: {
        status: "0x1",
        blockNumber: "0x10",
        logs: [logTransfer(CONTRATO_ARGT, OTRA_WALLET, OTRA_WALLET, bi("1000000000000000000"))],
      },
    });
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("destino_incorrecto");
  });

  it("12. pago verificado: normaliza monto con los decimales reales leídos onchain (18)", async () => {
    mockearRpc({
      recibo: {
        status: "0x1",
        blockNumber: "0x64",
        logs: [logTransfer(CONTRATO_ARGT, OTRA_WALLET, DESTINO, bi("2000000000000000000"))],
      },
      decimalesHex: "0x12", // 18
    });
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("verificado");
    expect(r.monto).toBe("2");
    expect(r.bloque).toBe(100);
    expect(r.desde?.toLowerCase()).toBe(OTRA_WALLET.toLowerCase());
    expect(r.explorerUrl).toContain(HASH_VALIDO);
  });

  it("13. pago por debajo del mínimo requerido → monto_insuficiente", async () => {
    mockearRpc({
      recibo: {
        status: "0x1",
        blockNumber: "0x64",
        logs: [logTransfer(CONTRATO_ARGT, OTRA_WALLET, DESTINO, bi("500000000000000000"))], // 0.5
      },
      decimalesHex: "0x12",
    });
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("monto_insuficiente");
  });

  it("14. si eth_call de decimals falla, sigue verificando con 18 decimales por defecto", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        const cuerpo = JSON.parse(String(init?.body)) as { method: string };
        if (cuerpo.method === "eth_getTransactionReceipt") {
          return respuestaJson({
            jsonrpc: "2.0",
            id: 1,
            result: {
              status: "0x1",
              blockNumber: "0x1",
              logs: [logTransfer(CONTRATO_ARGT, OTRA_WALLET, DESTINO, bi("1000000000000000000"))],
            },
          });
        }
        // eth_call falla (RPC caído para esa llamada puntual).
        return respuestaJson({ jsonrpc: "2.0", id: 1, error: { code: -32000, message: "boom" } });
      }),
    );
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("verificado");
    expect(r.monto).toBe("1");
  });

  it("15. falla de red al consultar el RPC → error_red, sin romper", async () => {
    mockearRpc({ fallaRed: true });
    const r = await verificarPago({ hash: HASH_VALIDO, moneda: "ARGt", montoMinimo: "1" });
    expect(r.estado).toBe("error_red");
  });

  it("16. SELECTOR_DECIMALS coincide con el usado para leer decimales onchain", () => {
    expect(SELECTOR_DECIMALS).toBe("0x313ce567");
  });
});

describe("validación de direcciones en config", () => {
  it("17. rechaza una dirección de contrato con longitud incorrecta (no son 20 bytes)", () => {
    vi.stubEnv("NEXT_PUBLIC_ARGT_CONTRATO", "0x1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a"); // 38 hex
    expect(direccionToken("ARGt")).toBeNull();
  });

  it("18. acepta una dirección de 40 hex bien formada", () => {
    expect(direccionToken("ARGt")).toBe(CONTRATO_ARGT);
    expect(direccionDestino()).toBe(DESTINO);
  });
});
