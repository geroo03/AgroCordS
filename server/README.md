# Backend — lotes, aplicaciones, plan y chat (Supabase)

Backend Express independiente para lo que hoy vive en `localStorage` del
navegador en la app Next.js (`src/lib/almacen.ts`, `plan.ts`, `chat/limite.ts`,
`notificaciones.ts`): lotes, aplicaciones registradas, plan premium, uso diario
del chatbot y notificaciones ya enviadas.

**No reemplaza nada todavía**: la app Next.js sigue funcionando igual que antes,
con localStorage. Este servidor queda preparado y testeado, listo para
conectarse el día que se cree un proyecto Supabase real y se decida hacer el
swap (pasar `almacen.ts` y compañía de síncronos a asíncronos, tocando cada
pantalla que los usa — un cambio grande, deliberadamente aparte de esto).

Las API routes de Next.js (`forecast`, `satellite`, `pagos/verificar`, `chat`,
`enso`) no se tocan ni se migran: siguen siendo el backend de todo lo demás.

## Arquitectura

- **Una única frontera con Supabase** ([src/lib/supabase.ts](src/lib/supabase.ts)):
  el resto del código nunca importa `@supabase/supabase-js` directo.
- **Auth por JWT de Supabase, no propia**: el login (magic link) lo dispara el
  cliente Next.js directo contra la Auth API de Supabase — este backend nunca
  manda el mail. Cada request trae `Authorization: Bearer <token>`; el
  middleware ([src/middleware/auth.ts](src/middleware/auth.ts)) lo valida con
  `supabase.auth.getUser(token)` y deja `req.userId` para el resto de la ruta.
- **Usa la service role key a propósito**, bypaseando Row Level Security: como
  el navegador nunca habla directo con Supabase para estas tablas (siempre
  pasa por acá), este servidor filtra manualmente por `user_id` en cada
  consulta. Las políticas RLS de `supabase/migrations/` quedan como respaldo
  de defensa en profundidad, no como el mecanismo principal.
- **Errores tipados → status HTTP**, mismo criterio que las API routes de
  Next.js: nunca un stack trace crudo al cliente (ver
  [src/errores.ts](src/errores.ts) y [src/middleware/manejoErrores.ts](src/middleware/manejoErrores.ts)).
- **Tipos duplicados a propósito** desde `src/lib/tipos.ts` de la app Next.js
  ([src/tipos.ts](src/tipos.ts)): es un proyecto Node independiente, sin npm
  workspaces todavía, así que no comparte código — hay que mantenerlos en
  sync a mano si cambian.

## Rutas

Todas requieren `Authorization: Bearer <token>` salvo `/health`.

| Método y path | Reemplaza a | Qué hace |
|---|---|---|
| `GET /lotes` | `listarLotes` | Lotes del usuario. |
| `GET /lotes/:id` | `obtenerLote` | Uno; 404 si no existe o no es suyo. |
| `POST /lotes` | `guardarLote` | Crea un lote. |
| `GET /lotes/:loteId/aplicaciones` | `listarAplicaciones` | Aplicaciones de ese lote (verifica que sea del usuario). |
| `GET /aplicaciones` | `listarTodasLasAplicaciones` | Todas las del usuario. |
| `POST /aplicaciones` | `guardarAplicacion` | Registra una (el lote debe ser suyo). |
| `GET /plan` | `obtenerPlan` | Trae el plan; lo crea en `'gratis'` si es la primera vez. |
| `PUT /plan` | `activarPremium` | Actualiza plan y, si corresponde, el pago que lo activó. `pago_hash` repetido → 409. |
| `GET /chat/uso` | `consultasRestantesHoy` | Consultas de hoy (0 si no hay fila). |
| `POST /chat/uso` | `registrarConsultaChat` | Incrementa el conteo de hoy. |
| `GET /notificaciones` | — | Ventanas ya notificadas, para deduplicar en el cliente. |
| `POST /notificaciones` | — | Registra una; si ya existía, responde 200 igual (idempotente). |
| `GET /health` | — | Sin auth, para monitoreo. |

## Configurar y correr

```bash
cd server
npm install
cp .env.example .env   # completar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Sin un proyecto Supabase real, el servidor arranca igual pero cualquier ruta
que toque la base falla — no hay fallback de demostración acá: a diferencia
de NDVI, servir datos de otro usuario o inventar una fila sería un error
grave, no una degradación aceptable. `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
se sacan de un proyecto en [supabase.com](https://supabase.com/dashboard) →
Project Settings → API — la migración a aplicar ahí es
[../supabase/migrations/20260912114804_esquema_inicial.sql](../supabase/migrations/20260912114804_esquema_inicial.sql).

**La service role key nunca debe llegar al navegador** ni a una variable
`NEXT_PUBLIC_*` — vive sólo en el `.env` de este servidor.

## Tests

```bash
npm test        # 27 tests, sin proyecto Supabase real: el cliente va mockeado
npx tsc --noEmit
npm run build
```

El doble de prueba ([tests/apoyo.ts](tests/apoyo.ts)) no mockea el SDK de
Supabase completo: como `crearApp` recibe el cliente por parámetro, alcanza
con pasarle un objeto con la misma forma (`.from(tabla)` encadenable y
awaitable, `.auth.getUser`). Cada tabla tiene su propia cola de resultados
programados, en el orden en que cada ruta la consulta.
