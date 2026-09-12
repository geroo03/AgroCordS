import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consultarGroq, GroqNoDisponibleError } from "../lib/chat/groq";
import type { Diagnostico } from "../lib/sintesis";
import type { ContextoLote } from "../lib/chat/tipos";

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function contexto(): ContextoLote {
  const diagnostico: Diagnostico = {
    estado: "favorable",
    titular: "Condiciones favorables para aplicar ahora",
    principal: "aplicacion",
    hallazgos: [],
  };
  return {
    lote: { nombre: "La Esperanza", cultivo: "Soja", areaHa: 45.2 },
    diagnostico,
    valorEconomico: null,
    aplicacionesRecientes: [],
  };
}

function respuestaGroqValida(respuesta: string, acciones: string[]) {
  return respuestaJson({
    choices: [{ message: { content: JSON.stringify({ respuesta, acciones }) } }],
  });
}

beforeEach(() => {
  vi.stubEnv("GROQ_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("consultarGroq", () => {
  it("con una respuesta válida, devuelve respuesta y acciones", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        respuestaGroqValida("Podés aplicar ahora, las condiciones son favorables.", [
          "Registrá la aplicación una vez terminada.",
        ]),
      ),
    );

    const resultado = await consultarGroq("¿puedo aplicar ahora?", contexto(), []);
    expect(resultado.respuesta).toContain("favorables");
    expect(resultado.acciones).toEqual(["Registrá la aplicación una vez terminada."]);
  });

  it("sin GROQ_API_KEY configurada, falla con GroqNoDisponibleError sin llamar a la red", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchEspia = vi.fn();
    vi.stubGlobal("fetch", fetchEspia);

    await expect(consultarGroq("hola", contexto(), [])).rejects.toBeInstanceOf(
      GroqNoDisponibleError,
    );
    expect(fetchEspia).not.toHaveBeenCalled();
  });

  it("un status no-2xx de Groq se traduce a GroqNoDisponibleError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respuestaJson({ error: "rate_limited" }, 429)));
    await expect(consultarGroq("hola", contexto(), [])).rejects.toBeInstanceOf(
      GroqNoDisponibleError,
    );
  });

  it("una respuesta sin choices se traduce a GroqNoDisponibleError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respuestaJson({ choices: [] })));
    await expect(consultarGroq("hola", contexto(), [])).rejects.toBeInstanceOf(
      GroqNoDisponibleError,
    );
  });

  it("un contenido que no es JSON válido se traduce a GroqNoDisponibleError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respuestaJson({ choices: [{ message: { content: "no es json" } }] })),
    );
    await expect(consultarGroq("hola", contexto(), [])).rejects.toBeInstanceOf(
      GroqNoDisponibleError,
    );
  });

  it("un JSON con forma inesperada (sin 'respuesta') se traduce a GroqNoDisponibleError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        respuestaJson({ choices: [{ message: { content: JSON.stringify({ foo: "bar" }) } }] }),
      ),
    );
    await expect(consultarGroq("hola", contexto(), [])).rejects.toBeInstanceOf(
      GroqNoDisponibleError,
    );
  });
});
