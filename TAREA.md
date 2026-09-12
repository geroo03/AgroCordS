# Equipo 2 — Satelital: alineación de la capa NDVI/NDRE al spec (M01)

Rama: `equipo2-satelital-m01`. Base: `main` en `geroo03/agroIA` (commit `586edb5`).

Este archivo es autocontenido: no hace falta el historial de la conversación que armó este reparto. Al terminar, borrá este archivo (`git rm TAREA.md`) en el último commit de la rama, antes de pedir el merge a `main`.

## Setup

```bash
git fetch
git checkout equipo2-satelital-m01
npm install
npm test    # confirmá 50/50 en verde antes de tocar nada
```

## Contexto: qué ya existe (no es una integración nueva)

La capa satelital ya funciona con Sentinel-2 real vía Copernicus Data Space / Sentinel Hub Statistical API (OAuth2, cache de 6h, fallback a demo sin credenciales). Todo vive en `src/lib/satelital/`. Esta tarea es **ajustar 3 detalles puntuales** para alinearla a un spec más nuevo, no reescribir nada. Cambios chicos, en código ya probado — probá después de cada uno.

## Tarea A — Sumar clase 11 (nieve) a la máscara de nubes (~10 min)

En [`src/lib/satelital/evalscript.ts`](src/lib/satelital/evalscript.ts) línea 41:

```js
var nuboso = sample.SCL === 3 || sample.SCL === 8 || sample.SCL === 9 || sample.SCL === 10;
```

Sumar la clase 11 (nieve/hielo — SCL la usa para eso, y confunde el NDVI igual que una nube):

```js
var nuboso = sample.SCL === 3 || sample.SCL === 8 || sample.SCL === 9 || sample.SCL === 10 || sample.SCL === 11;
```

Actualizar también el comentario de cabecera del archivo (líneas 15-19) que hoy dice "sombra de nube (3), nube de probabilidad media (8) o alta (9), o cirro (10)" — agregar ", o nieve/hielo (11)".

## Tarea B — Pasar de agregación diaria a P5D (~20 min)

En [`src/lib/satelital/sentinelhub.ts`](src/lib/satelital/sentinelhub.ts) línea 135:

```ts
aggregationInterval: { of: "P1D" },
```

Cambiar a:

```ts
aggregationInterval: { of: "P5D" },
```

**Por qué**: `P5D` agrupa pasadas en bloques de 5 días en vez de uno por día — reduce ruido y consumo de cuota de la API sin perder granularidad relevante (Sentinel-2 revisita cada ~5 días de todos modos con las dos plataformas). Sentinel Hub va a devolver un dato por bloque de 5 días en el rango consultado en vez de uno por día individual con pasada.

**Cuidado**: esto cambia la forma en que se arman las fechas de cada observación en la respuesta — revisá cómo se construye `fecha` en la función que procesa la respuesta de Sentinel Hub (buscá donde se lee `interval.from`/`interval.to` o similar en `sentinelhub.ts`) y confirmá que sigue usando una fecha representativa razonable (el inicio del intervalo, por ejemplo). Los 12 tests de `src/tests/satelital.test.ts` mockean la respuesta de Sentinel Hub — vas a tener que ajustar los fixtures que usan intervalos diarios a intervalos de 5 días (buscá `aggregationInterval` o fechas consecutivas día a día en ese archivo de test).

## Tarea C — Exponer el campo de confianza explícitamente (~15 min)

Ya existe la lógica: `FRACCION_LIMPIA_MINIMA = 0.5` en [`config.ts`](src/lib/satelital/config.ts), y `sentinelhub.ts` línea 268 ya calcula `confiable = fraccionLimpiaLote >= FRACCION_LIMPIA_MINIMA` y por debajo de eso guarda `ndvi`/`ndre` como `null`. Lo que falta: exponer esa señal como un campo explícito y tipado en vez de que quede implícita en "ndvi es null".

1. En `src/lib/satelital/tipos.ts`, agregar al tipo de cada observación un campo `confianza: 'alta' | 'baja'`.
2. En `sentinelhub.ts`, donde se arma cada observación, setear `confianza: confiable ? 'alta' : 'baja'`.
3. Revisar los componentes que consumen esto en `src/components/ndvi/` (`SerieNdvi.tsx`, `DetalleLectura.tsx`) — si tiene sentido, mostrar la confianza baja de alguna forma visible (por ejemplo, ya hay un estilo para "sin dato confiable, nublado" en `SerieNdvi.tsx` — podés reusar ese criterio o extenderlo).
4. Documentar en el comentario de cabecera de `sentinelhub.ts` o `config.ts` que `FRACCION_LIMPIA_MINIMA = 0.5` corresponde al mínimo de píxeles limpios sobre el lote para considerar la observación de confianza alta (dejar explícito, ya que un spec de referencia habla de un umbral del 40% — el actual es más estricto, aclarar esa diferencia en el comentario para que quede documentada la decisión).

**No tocar**: `src/lib/spray-engine.ts`, `src/lib/openmeteo.ts`, `src/lib/geo.ts` (son de otros equipos). Si necesitás tocar `src/app/lotes/[id]/page.tsx` (el encabezado del lote), avisá — es un archivo compartido con los equipos de Helada y Agronómico; idealmente esta tarea no lo toca.

## Verificación antes de terminar

```bash
npm test     # los 12 tests de satelital.test.ts en verde con los fixtures ajustados
npm run build
```

Si hay credenciales de Sentinel Hub configuradas (`.env.local`), probar en el navegador (`npm run dev`, ir a `/lotes/[id]/ndvi` con Premium activado) que la serie sigue trayendo datos reales tras el cambio a P5D.

## Al terminar

1. `git rm TAREA.md` en un commit final.
2. Commit con mensaje claro (español, estilo del resto del repo), termina con:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
3. `git push` a esta misma rama.
4. Avisar que la rama `equipo2-satelital-m01` está lista para mergear a `main`.
