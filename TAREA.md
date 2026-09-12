# Equipo 3a — Alerta de helada (M07)

Rama: `equipo3-helada-m07`. Base: `main` en `geroo03/agroIA` (commit `586edb5`).

Este archivo es autocontenido: no hace falta el historial de la conversación que armó este reparto. Al terminar, borrá este archivo (`git rm TAREA.md`) en el último commit de la rama, antes de pedir el merge a `main`.

## Setup

```bash
git fetch
git checkout equipo3-helada-m07
npm install
npm test    # confirmá 50/50 en verde antes de tocar nada
```

## Por qué este módulo es factible hoy (y otros del spec no)

Este módulo **reutiliza datos que la app ya trae** de Open-Meteo — no hace falta ninguna fuente nueva. `/api/forecast` ya devuelve, para cada una de las próximas 72 horas, temperatura, viento, nubosidad y si es de día o de noche (ver `HourlyConditions` en [`src/lib/spray-engine.ts`](src/lib/spray-engine.ts), líneas 19-36: `time`, `temperatureC`, `relativeHumidityPct`, `windSpeedKmh`, `windGustsKmh`, `precipitationMm`, `cloudCoverPct`, `isDay`). Todo lo que hace falta para calcular riesgo de helada ya está en esa estructura.

## El ajuste agronómico clave (por qué no alcanza con mirar la temperatura cruda)

Los pronósticos dan temperatura a 2 m de altura (la garita meteorológica). El daño por helada ocurre en el canopeo del cultivo, que en una noche de **cielo despejado y viento calmo** (enfriamiento radiativo) puede estar **2-4°C más frío** que la temperatura a 2 m. Si alertás con el número crudo del pronóstico, subestimás el riesgo real (falso negativo) justo en la condición donde más importa.

**Regla**: si `cloudCoverPct < 30 && windSpeedKmh < 8` en una hora nocturna (`isDay === false`), restar 3°C a `temperatureC` antes de comparar contra el umbral de daño. Si no se cumple esa condición, no restar nada (no hay enfriamiento radiativo relevante).

## Umbrales por cultivo

`Lote.cultivo` es un string libre (no una lista cerrada) — armá un mapeo simple con fallback razonable:

| Cultivo (buscar coincidencia, sin distinguir mayúsculas/acentos) | Umbral de daño | Nota |
|---|---|---|
| "trigo" | **−4°C durante ~2 h continuas** en la franja considerada de mayor sensibilidad (encañazón) | Espigazón/antesis es mucho más sensible (umbral cercano a 0°C), pero la app no sabe la etapa fenológica del lote — usá el umbral de −4°C como el genérico para trigo y dejalo dicho explícitamente en la UI ("umbral genérico, no ajustado por etapa fenológica") |
| "soja", "maíz"/"maiz" | **0°C en canopeo** ya es daño | Sin matices adicionales |
| cualquier otro valor / sin cultivo cargado | Usar el umbral de soja/maíz (0°C) como default conservador, y aclarar en la UI que es un umbral genérico | |

## Qué construir

1. **`src/lib/helada.ts`** (nuevo, funciones puras, mismo estilo que `spray-engine.ts`: comentarios de cabecera explicando el razonamiento agronómico, sin I/O):
   - Un tipo `RiesgoHelada` con al menos: `time`, `temperaturaCanopeoC` (la ajustada), `enRiesgo: boolean`, `razon: string` (explicación tipo "Temperatura de canopeo estimada en -4,2°C con cielo despejado y viento calmo").
   - Una función `evaluarHelada(hours: HourlyConditions[], cultivo: string | null): RiesgoHelada[]` que aplica el ajuste de canopeo y compara contra el umbral por cultivo, hora por hora, para las 72 horas.
   - Una función que resuma si hay alguna hora en riesgo en la ventana completa (para mostrar un veredicto simple arriba de la lista, similar a como `spray-engine.ts` tiene `assessHour` y algo que resume — mirá el patrón, no hace falta copiarlo literal).
2. **Tests** en `src/tests/helada.test.ts`, con casos mínimos:
   - Noche despejada y calma con temperatura a 2m de -1°C en un lote de soja → riesgo (canopeo estimado en -4°C, por debajo de 0).
   - Misma temperatura pero de día → sin riesgo (el ajuste de canopeo sólo aplica de noche).
   - Noche nublada o con viento >8 km/h → sin ajuste de canopeo, se compara la temperatura cruda.
   - Trigo con temperatura de canopeo en -4°C → riesgo; en -3°C → sin riesgo (umbral es -4, no -3).
   - Cultivo desconocido/`null` → usa el umbral de 0°C (soja/maíz).
3. **UI**: una tarjeta nueva en la pantalla de decisión del lote ([`src/app/lotes/[id]/page.tsx`](src/app/lotes/[id]/page.tsx)) — no hace falta una pantalla separada, es una sección más en la misma pantalla del veredicto de pulverización (parecido a como `Ventanas.tsx` es una sección dentro de esa misma pantalla). Mostrá: si hay riesgo de helada en las próximas 72h, en qué momento, y la razón (canopeo estimado + condición). Si no hay riesgo, un estado tranquilo tipo "Sin riesgo de helada detectado en las próximas 72 h". **Aclaración obligatoria en la UI**: esto se calcula al abrir la pantalla, no es un aviso automático en segundo plano — no prometer una notificación a las 3 AM, sólo mostrar el dato cuando el usuario mira la app.
4. **Un solo link nuevo** en el header de esa misma pantalla, línea ~111 de [`src/app/lotes/[id]/page.tsx`](src/app/lotes/[id]/page.tsx) — agregalo **entre el link de "Riesgo" (línea 109-111) y el de "Historial" (línea 112-114)** si decidís que amerita su propia pantalla en vez de una sección — pero la recomendación es que sea una sección dentro de la pantalla de decisión, no una pantalla nueva, para evitar tocar el header en absoluto. Si igual preferís pantalla separada, avisá al equipo que integra las ramas, porque el equipo 3b (Agronómico) también agrega un link ahí y hay que coordinarlos.

**No tocar**: `src/lib/spray-engine.ts` (no cambia el motor de pulverización — la helada es un módulo separado, informativo, que **no** altera el veredicto de "condiciones favorables/no favorables"), `src/lib/openmeteo.ts`, `src/lib/geo.ts`, `src/lib/satelital/` (son de otros equipos).

## Verificación antes de terminar

```bash
npm test     # incluidos los tests nuevos de helada.test.ts
npm run build
```

Probar en el navegador (`npm run dev`) entrando a un lote y confirmando que la tarjeta de helada aparece con datos reales de Open-Meteo (no hace falta ningún dato mockeado — el pronóstico ya viene de la API real).

## Al terminar

1. `git rm TAREA.md` en un commit final.
2. Commit con mensaje claro (español, estilo del resto del repo), termina con:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
3. `git push` a esta misma rama.
4. Avisar que la rama `equipo3-helada-m07` está lista para mergear a `main`, y si tocaste el header compartido, avisar explícitamente en qué línea para coordinar con el equipo Agronómico.
