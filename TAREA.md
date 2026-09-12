# Equipo 1 — Núcleo: corrección legal + validaciones de polígono (M06 + M02)

Rama: `equipo1-nucleo-legal-poligonos`. Base: `main` en `geroo03/agroIA` (commit `586edb5`).

Este archivo es autocontenido: no hace falta el historial de la conversación que armó este reparto. Al terminar, borrá este archivo (`git rm TAREA.md`) en el último commit de la rama, antes de pedir el merge a `main`.

## Setup

```bash
git fetch
git checkout equipo1-nucleo-legal-poligonos
npm install
npm test    # confirmá 50/50 en verde antes de tocar nada
```

## Tarea A — M06: corrección de lenguaje legal (~20 min)

**Problema real**: [`src/components/decision/Veredicto.tsx`](src/components/decision/Veredicto.tsx) usa como veredicto principal la palabra **"Aplicá ahora"** (línea ~49) y **"No apliques"** (línea ~52). Bajo la Ley provincial 9164 (aplicación de fitosanitarios, requiere profesional matriculado), una app no debe decirle al usuario que aplique o no aplique — sólo puede describir condiciones. El pie de página ya tiene un disclaimer, pero el titular grande contradice ese disclaimer.

**Qué hacer**:
1. Cambiar el texto del veredicto de instrucción a descripción de condición. Sugerido (podés ajustar la redacción, mantené el espíritu):
   - `"Aplicá ahora"` → `"Condiciones favorables"`
   - `"Al límite"` → se puede dejar igual (ya es descriptivo, no imperativo)
   - `"No apliques"` → `"Condiciones no favorables"`
2. Revisar si algún otro componente repite esas frases como ejemplo (`grep -rn "Aplicá ahora\|No apliques" src/`) y actualizarlo — probablemente aparecen en `README.md` y/o `PRODUCTO.md` como ejemplos de captura de pantalla o de copy.
3. El pie de página legal existente no se toca (ya está bien).

**No tocar**: `src/lib/spray-engine.ts` (el motor de decisión, sus umbrales y su `Suitability` type no cambian — esto es sólo un cambio de texto en la UI, no de lógica).

## Tarea B — M02: validaciones de polígono (~45-60 min)

**Estado actual**: [`src/lib/geo.ts`](src/lib/geo.ts), función `validarPoligono`, sólo chequea:
- mínimo 4 vértices
- área mínima 0,5 ha (`AREA_MINIMA_HA`)

**Qué falta agregar** (mismo archivo, misma función o funciones auxiliares nuevas en el mismo archivo):

1. **Auto-intersección**: un polígono cuyos lados se cruzan a sí mismos no es un lote válido. Podés detectarlo con un chequeo geométrico simple (segmento contra segmento, todos los pares no adyacentes) sin agregar dependencias nuevas, o evaluar sumar `@turf/kinks` (ya usamos `@turf/area` y `@turf/centroid`, así que sumar un paquete más de la misma familia Turf es consistente con lo ya usado). Mensaje sugerido: `"El polígono se cruza a sí mismo. Volvé a dibujarlo sin que los lados se toquen."`
2. **Área máxima**: agregar `AREA_MAXIMA_HA = 5000` (constante exportada, mismo estilo que `AREA_MINIMA_HA`) y rechazar por encima de eso. Mensaje sugerido: `"El lote es demasiado grande para cargarlo como un polígono. Dividilo en lotes más chicos."`
3. **Solapamiento >10% con un lote existente**: esta validación necesita la lista de lotes ya guardados (`listarLotes()` de [`src/lib/almacen.ts`](src/lib/almacen.ts)) para comparar contra el nuevo polígono antes de guardarlo. Usá `@turf/intersect` (o `@turf/boolean-overlap` si alcanza) para calcular el área de intersección entre el nuevo polígono y cada lote existente, y compará contra el área del nuevo polígono. Mensaje sugerido: `"Este polígono se superpone en más de un 10% con '{nombre del lote existente}'. Revisá si no es el mismo lote dibujado dos veces."` — esta validación se llama desde donde hoy se llama `validarPoligono` en [`src/app/lotes/page.tsx`](src/app/lotes/page.tsx) (necesita acceso a los lotes existentes, así que puede ser una función separada, ej. `validarSolapamiento(geometryNueva, lotesExistentes)`, llamada además de `validarPoligono`).

**Tests**: agregá o creá `src/tests/geo.test.ts` con casos para: polígono válido (pasa), polígono con auto-intersección (rechaza), área bajo el mínimo (ya existente, confirmar que sigue pasando), área sobre el máximo nuevo (rechaza), solapamiento >10% con un lote existente (rechaza), solapamiento <10% (pasa).

**No tocar**: `src/lib/spray-engine.ts`, `src/lib/openmeteo.ts`, la carpeta `src/lib/satelital/` (son de otros equipos).

## Verificación antes de terminar

```bash
npm test     # todo en verde, incluidos los tests nuevos de geo
npm run build
```

Probar a mano en el navegador (`npm run dev`, ir a `/lotes`): dibujar un polígono que se cruce a sí mismo y confirmar que se rechaza con el mensaje nuevo; dibujar un polígono superpuesto a uno de los 3 lotes de ejemplo y confirmar que se rechaza.

## Al terminar

1. `git rm TAREA.md` en un commit final.
2. Commit con mensaje claro (español, estilo del resto del repo), termina con:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
3. `git push` a esta misma rama.
4. Avisar que la rama `equipo1-nucleo-legal-poligonos` está lista para mergear a `main`.
