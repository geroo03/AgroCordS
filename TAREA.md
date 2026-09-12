# Equipo 3b — Balance hídrico + grados día acumulados (M03 + M04, versión reducida)

Rama: `equipo3-agronomico-m03-m04`. Base: `main` en `geroo03/agroIA` (commit `586edb5`).

Este archivo es autocontenido: no hace falta el historial de la conversación que armó este reparto. Al terminar, borrá este archivo (`git rm TAREA.md`) en el último commit de la rama, antes de pedir el merge a `main`. Es la tarea más grande de las 4 (~2-2,5 h) — si el tiempo aprieta, la Tarea D (pantalla) es la parte más recortable: incluso una sola tarjeta con los dos números ya es un resultado honesto y útil.

## Setup

```bash
git fetch
git checkout equipo3-agronomico-m03-m04
npm install
npm test    # confirmá 50/50 en verde antes de tocar nada
```

## Por qué esto es más grande que los otros paquetes (léelo antes de empezar)

Balance hídrico (M03) y grados día (M04) necesitan clima **histórico** desde una fecha de siembra — algo que Open-Meteo Forecast API (la que ya usa esta app) no da, porque sólo mira hacia adelante. Ya verifiqué que la **Archive API** de Open-Meteo sirve esto sin API key, con el mismo estilo que la que ya se usa:

```bash
curl "https://archive-api.open-meteo.com/v1/archive?latitude=-32.7&longitude=-62.1&start_date=2026-05-01&end_date=2026-05-05&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&timezone=auto"
```

Devuelve, por día: `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, y **`et0_fao_evapotranspiration`** (evapotranspiración de referencia FAO-56, ya calculada por Open-Meteo — no hace falta calcularla). Probalo vos mismo antes de escribir código, para confirmar el formato exacto de la respuesta.

**Importante, para que la demo sea honesta**: NO se construye la comparación "vs. promedio de 10 campañas de la zona" que a veces se menciona para este tipo de módulo — necesitaría 10 años de clima agrupado por zona, que no entra en el tiempo disponible. Sólo se muestra el acumulado desde la fecha de siembra que cargue el usuario, dicho así de claro en la pantalla.

## Tarea A — `src/lib/historico.ts` (nuevo, ~25-30 min)

Mismo patrón que [`src/lib/openmeteo.ts`](src/lib/openmeteo.ts) (que ya existe, miralo como referencia de estilo: fetch + validación con Zod + traducción a un tipo de dominio propio, con una clase de error dedicada).

```ts
export async function fetchHistoricoDiario(opts: {
  latitude: number;
  longitude: number;
  desde: string; // 'YYYY-MM-DD'
  hasta: string; // 'YYYY-MM-DD'
}): Promise<DiaHistorico[]>
```

Donde `DiaHistorico` es algo como `{ fecha: string; tMaxC: number; tMinC: number; precipitacionMm: number; et0Mm: number }`. Validá la respuesta con Zod (mismo criterio que `openmeteo.ts`: si algún día viene con `null` en un campo clave, excluilo de la serie en vez de inventar un valor). Usá una clase de error propia (ej. `HistoricoNoDisponibleError`) para que quien consuma esto pueda mostrar un estado de error claro, no una pantalla rota.

## Tarea B — `src/lib/agronomico.ts` (nuevo, funciones puras, ~35-45 min)

Mismo estilo que [`src/lib/spray-engine.ts`](src/lib/spray-engine.ts): sin I/O, comentarios explicando el razonamiento agronómico, umbrales en una constante exportada tipo `THRESHOLDS` para que sean fáciles de ajustar después.

**GDD (grados día acumulados), método modificado con techo**:

```ts
export const UMBRALES_GDD = {
  soja:  { tBaseC: 10, techoC: 30 },
  maiz:  { tBaseC: 10, techoC: 30 },
  trigo: { tBaseC: 0,  techoC: 26 },
} as const;

export function calcularGddAcumulado(dias: DiaHistorico[], cultivo: string | null): number
```

Por cada día: acotar `tMaxC` y `tMinC` **individualmente** al rango `[tBase, techo]` (esto es lo que hace que sea el "método modificado" y no un promedio simple — un día de 38°C no debe sumar más GDD que uno de 30°C si el techo del cultivo es 30), después `GDD_día = (tMax' + tMin')/2 - tBase`, sumar todos los días (nunca restar si da negativo — un día muy frío aporta 0, no GDD negativo). Cultivo no reconocido → usar los umbrales de soja/maíz como default, mismo criterio que el equipo de Helada.

**Índice de agotamiento hídrico (0 a 1, nunca milímetros absolutos)**:

```ts
export const AGUA_UTIL_MAX_MM = 175; // Aproximación única, no depende del suelo real del lote — declarar esto en la UI.

export function calcularIndiceAgotamiento(dias: DiaHistorico[], kc: number): number
```

Balde simple: `reserva` arranca en `AGUA_UTIL_MAX_MM` (suelo a capacidad de campo en la siembra, supuesto declarado), y por cada día `reserva = clamp(reserva + precipitacionMm - et0Mm × kc, 0, AGUA_UTIL_MAX_MM)`. El resultado final es `1 - reserva/AGUA_UTIL_MAX_MM` (0 = suelo lleno, 1 = agotado). Para `kc`, no hace falta modelar la curva fenológica completa de FAO-56 — usá un valor único razonable por cultivo (ej. 0,8 como aproximación de la etapa de mayor demanda) y decilo explícitamente en un comentario como simplificación deliberada.

**Tests** en `src/tests/agronomico.test.ts`: al menos un caso de GDD con temperaturas normales, uno con una temperatura por encima del techo (confirmar que no suma de más), uno de agotamiento con lluvia abundante (índice baja/se mantiene bajo) y uno con sequía sostenida (índice sube hacia 1, sin pasarse de 1).

## Tarea C — Campo `fechaSiembra` en `Lote` (~20-25 min)

1. En [`src/lib/tipos.ts`](src/lib/tipos.ts), agregar a la interfaz `Lote` (después de `cultivo`, línea ~11): `fechaSiembra: string | null; // ISO 'YYYY-MM-DD'`.
2. En [`src/lib/almacen.ts`](src/lib/almacen.ts), función `guardarLote` (línea ~54) e interfaz `NuevoLote` (línea ~48): agregar el mismo campo, opcional, con default `null` si no se pasa.
3. En [`src/app/lotes/page.tsx`](src/app/lotes/page.tsx), en el formulario de alta de lote (donde hoy se cargan nombre y cultivo), agregar un input de fecha opcional para "Fecha de siembra". No es obligatorio completarlo — un lote sin fecha sigue siendo válido, sólo no va a poder mostrar la pantalla de balance/GDD hasta que se cargue.
4. Los 3 lotes de ejemplo (Marcos Juárez, Río Cuarto, Villa María) no tienen fecha de siembra — está bien que la pantalla nueva les pida cargarla en vez de inventarles una.

## Tarea D — Pantalla `/lotes/[id]/agronomico` (~30-40 min)

Nueva pantalla, mismo patrón que `/lotes/[id]/ndvi` o `/lotes/[id]/riesgo` (mirá esas como referencia de estructura: header con el mismo patrón de vuelta al lote, estado de carga, estado vacío). Dos tarjetas: GDD acumulado desde la siembra, e índice de agotamiento (mostrado como una barra o número 0-1, nunca en mm). **Gratis, no detrás del Paywall** — a diferencia de NDVI/Riesgo, esto no consume cuota de ningún proveedor pago (la Archive API de Open-Meteo es gratis y sin key), así que no tiene sentido cobrarlo iguial.

Si el lote no tiene `fechaSiembra` cargada: mostrar un estado vacío (mismo componente `Vacio.tsx` que ya se usa en el resto de la app) pidiendo cargarla, con un link al alta de lote — nunca inventar una fecha ni mostrar un número sin base real.

**Un solo link nuevo** en el header de [`src/app/lotes/[id]/page.tsx`](src/app/lotes/[id]/page.tsx), agregalo **inmediatamente después del link de "Historial" (después de la línea ~114)**, así tu línea nueva queda al final del grupo y no choca con la del equipo de Helada (que agrega la suya, si corresponde, entre "Riesgo" e "Historial"). Si el equipo de Helada decidió NO tocar el header (poniendo todo como sección dentro de la misma pantalla, que es lo recomendado para ellos), vas a ser el único que toca esa línea — mejor todavía, cero conflicto.

**No tocar**: `src/lib/spray-engine.ts`, `src/lib/openmeteo.ts` (no lo modifiques — `historico.ts` es un archivo nuevo y separado, no una extensión de `openmeteo.ts`), `src/lib/geo.ts`, `src/lib/satelital/` (son de otros equipos).

## Verificación antes de terminar

```bash
npm test     # incluidos los tests nuevos de agronomico.test.ts
npm run build
```

Probar en el navegador (`npm run dev`): cargar un lote nuevo con fecha de siembra, confirmar que la pantalla trae GDD e índice de agotamiento reales de la Archive API; entrar a uno de los 3 lotes de ejemplo (sin fecha) y confirmar que muestra el estado vacío pidiendo la fecha, no un dato inventado.

## Al terminar

1. `git rm TAREA.md` en un commit final.
2. Commit con mensaje claro (español, estilo del resto del repo), termina con:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
3. `git push` a esta misma rama.
4. Avisar que la rama `equipo3-agronomico-m03-m04` está lista para mergear a `main`, y confirmar en qué línea exacta quedó tu link del header para coordinar con el equipo de Helada si ambos lo tocaron.
