/**
 * Doble de prueba de ClienteSupabase, sin mockear el SDK completo: como
 * `crearApp` recibe el cliente por parámetro (inyección de dependencias),
 * alcanza con pasarle un objeto con la misma forma que usan las rutas
 * (`.from(tabla)...` encadenable y awaitable, `.auth.getUser(token)`).
 *
 * Cada tabla tiene su propia cola FIFO de resultados: cada ruta que hace más
 * de una consulta a la misma tabla dentro de un mismo request (por ejemplo,
 * "leer" y después "escribir") programa un resultado por llamada, en el
 * orden en que la ruta las hace.
 */

import type { ClienteSupabase } from "../src/lib/supabase.js";

export interface ResultadoSupabase {
  readonly data?: unknown;
  readonly error?: { message: string; code?: string } | null;
}

class ConstructorFalso implements PromiseLike<ResultadoSupabase> {
  constructor(private readonly resultado: ResultadoSupabase) {}
  select() {
    return this;
  }
  insert() {
    return this;
  }
  upsert() {
    return this;
  }
  update() {
    return this;
  }
  eq() {
    return this;
  }
  order() {
    return this;
  }
  single() {
    return Promise.resolve(this.resultado);
  }
  maybeSingle() {
    return Promise.resolve(this.resultado);
  }
  then<TResult1 = ResultadoSupabase, TResult2 = never>(
    onfulfilled?: ((value: ResultadoSupabase) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.resultado).then(onfulfilled, onrejected);
  }
}

export function crearSupabaseFalso() {
  const colas = new Map<string, ResultadoSupabase[]>();
  const usuarios = new Map<string, string | null>();

  return {
    /** Encola el próximo resultado que devolverá una llamada a esta tabla. */
    programarResultado(tabla: string, resultado: ResultadoSupabase) {
      const cola = colas.get(tabla) ?? [];
      cola.push(resultado);
      colas.set(tabla, cola);
    },
    /** `userId: null` simula un token reconocido pero inválido/vencido. */
    programarUsuario(token: string, userId: string | null) {
      usuarios.set(token, userId);
    },
    cliente: {
      from(tabla: string) {
        const cola = colas.get(tabla) ?? [];
        const resultado = cola.shift();
        if (!resultado) {
          throw new Error(`Test mal armado: no hay resultado programado para la tabla "${tabla}".`);
        }
        return new ConstructorFalso(resultado);
      },
      auth: {
        async getUser(token: string) {
          if (!usuarios.has(token)) {
            return { data: { user: null }, error: { message: "token desconocido" } };
          }
          const userId = usuarios.get(token) ?? null;
          if (userId === null) {
            return { data: { user: null }, error: { message: "token inválido" } };
          }
          return { data: { user: { id: userId } }, error: null };
        },
      },
    } as unknown as ClienteSupabase,
  };
}
