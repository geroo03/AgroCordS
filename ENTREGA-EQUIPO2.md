# Equipo 2 — M01 satelital: entrega

Rama `equipo2-satelital-m01`, base `main` (`e9d46c4`). El paquete está **terminado y listo para mergear**. `TAREA.md` se borró en el commit final, como pedía el brief.

Este archivo existe para que quien mergee no tenga que reconstruir el porqué de una decisión que **se apartó del brief**. Se puede borrar una vez integrado a `main`.

## Estado de las tres tareas

| Tarea | Pedido | Entregado |
|---|---|---|
| **A** — máscara de nubes | sumar SCL 11 (nieve) | ✅ y además SCL 0 y 1 |
| **B** — agregación temporal | cambiar `P1D` → `P5D` | ⚠️ **se mantuvo `P1D`** — ver abajo |
| **C** — confianza explícita | campo `'alta' \| 'baja'` | ✅ con 4 niveles en vez de 2 |

### A — Máscara de nubes (`evalscript.ts`)

`SCL_DESCARTADAS = [0, 1, 3, 8, 9, 10, 11]`. Además de la clase 11 (nieve/hielo) que pedía el brief, se sumaron 0 (sin dato) y 1 (saturado/defectuoso): ninguna de las dos aporta reflectancia utilizable y ambas entraban al promedio como si fueran cultivo.

Se conservan a propósito, y está documentado en el archivo: 2 (sombra proyectada — marginal sobre relieve llano, y descartarla cuesta pasadas enteras en lotes con arboledas al borde), 6 (agua — un lote anegado es información real) y 7 (no clasificado — descartarlo enmascararía suelo desnudo y rastrojo, que son estados legítimos del cultivo). Un agrónomo puede querer revisar el criterio del 2.

**Dos defectos que aparecieron al tocar esto y se corrigieron:**

1. **`NaN` contaminante.** `indices.ts` se protegía de `B08 + B04 = 0`; el evalscript no. Un solo píxel con suma cero emitía `NaN`, y Sentinel Hub no lo filtra: envenenaba el promedio de toda la fecha. Ahora un índice indefinido o fuera de `[-1, 1]` invalida el píxel.
2. **SCL no entero.** La banda viene a 20 m remuestreada a 10 m. Un valor `8.8` quedaba fuera de la lista de descartadas y una nube pasaba como píxel limpio. Se redondea antes de comparar.

### B — Agregación temporal: se mantuvo `P1D`

**Esto se aparta del brief y necesita el visto bueno de quien mergea.** El cambio a `P5D` no se aplicó, por decisión explícita del equipo tras evaluarlo.

El brief justifica `P5D` con que Sentinel-2 revisita cada ~5 días. A la latitud de los lotes del proyecto (−32°: Marcos Juárez, Río Cuarto, Villa María) el solape de órbitas adyacentes da pasadas cada 2-3 días, así que un bloque de 5 días **suele contener dos pasadas**. Con `P5D`:

- la media mezcla dos adquisiciones de días distintos, y
- la fecha informada pasa a ser el inicio del bloque, que no es ninguna fecha de adquisición real.

Eso contradice dos cosas que el propio repositorio afirma: la invariante de `tipos.ts` (*"es la fecha de ADQUISICIÓN de Sentinel-2: nunca una fecha inventada para rellenar el calendario"*) y la promesa del README (*"Observaciones reales, no interpoladas"*), que es el argumento de honestidad central del módulo. El propio brief anticipa el problema en su nota de "Cuidado". El ahorro de cuota que argumenta no se pudo medir sin credenciales.

**Si `main` prefiere `P5D` igual**, el cambio es de una línea (`INTERVALO_AGREGACION` en `sentinelhub.ts`), pero hay que además: ajustar los fixtures de test a intervalos de 5 días, y corregir el comentario de `tipos.ts` y el bullet del README, porque las dos afirmaciones dejan de ser ciertas.

**Lo que sí se hizo en agregación temporal**: `P1D` dejó de ser un literal suelto y pasó a constante documentada, y se corrigió un defecto real — cuando el lote cae sobre el solape de dos órbitas, una misma fecha volvía partida en varios intervalos y se emitían **dos puntos para una sola pasada**. Ahora se fusionan en una observación, con las medias **ponderadas por píxeles válidos** (un tile que aporta 900 píxeles limpios pesa más que uno que aporta 100; el promedio simple daba un valor que no es el del lote).

### C — Confianza explícita (`tipos.ts`)

`ObservacionSatelital.confianza: NivelConfianza | null`, con `NivelConfianza = 'alta' | 'media' | 'baja' | 'nula'`.

El brief pedía `'alta' | 'baja'`. Se entregaron cuatro niveles porque dos reproducen el problema que el campo venía a resolver: con el corte binario, un valor apoyado en el 51 % del lote limpio y otro apoyado en el 99 % se informan idénticos. Umbrales en `config.ts` (`UMBRAL_CONFIANZA`), derivación en `clasificarConfianza`.

Se mantiene la invariante `confianza === "nula"` ⟺ `ndvi`/`ndre` en `null`, así que **el comportamiento anterior no cambió**: es información estrictamente adicional. La serie de demostración lleva `null` — en datos sintéticos no hay píxeles que contar, y declarar "alta" sería mentir sobre un dato que no se midió.

**Punto C.4 del brief**: documentado en `config.ts`. `FRACCION_LIMPIA_MINIMA = 0.5` es deliberadamente más estricto que el 40 % del spec de referencia; con menos de medio lote limpio el promedio describe mejor al sector despejado que al lote. Alinearlo es cambiar esa constante a `0.4` — ningún otro archivo tiene el valor hardcodeado.

**En la UI** (`src/components/ndvi/`): leyenda de respaldo en `FuenteDatos`, aviso explicativo en `DetalleLectura` cuando la confianza es media o baja, y **punto hueco** en la serie para confianza baja — forma redundante al color, mismo criterio de daltonismo que la línea de tiempo horaria. Los `aria-label` de los chips de fecha incluyen el nivel.

## Verificación

```
npm test          # 59/59 ✓   (50 de base + 9 nuevos)
npx tsc --noEmit  # limpio
npm run build     # ✓ Compiled successfully
```

Los 6 tests de la máscara no revisan el texto del evalscript: lo **compilan y ejecutan** con `new Function`, así que verifican qué píxel sobrevive en el código real que se envía a Sentinel Hub.

También se verificó en el navegador (`/lotes/[id]/ndvi` con Premium activado): la serie demo renderiza sin regresión, y con una respuesta de `/api/satellite` inyectada con los cuatro niveles se confirmó el punto hueco, el corte de línea en la observación nula, la leyenda de respaldo y el aviso de confianza baja. Sin errores en consola.

### Lo que NO se verificó

**Nunca corrió contra Sentinel Hub real**: no hay credenciales en el proyecto. Por lo tanto:

1. El evalscript nuevo no fue ejecutado por el runtime de Copernicus, sólo por Node. La lógica JS es correcta y el código es estándar, pero que el sandbox lo acepte no está comprobado.
2. El parseo sigue apoyado en el esquema documentado de la Statistical API, no en una respuesta real. Ese riesgo ya existía antes de estos cambios.
3. La fusión de fechas duplicadas nunca vio un solape de órbitas real: es una red de seguridad, y puede que con `P1D` Sentinel Hub no devuelva duplicados nunca.

Cerrar el punto 1 es gratis: una cuenta en [dataspace.copernicus.eu](https://dataspace.copernicus.eu/) → Sentinel Hub dashboard → OAuth clients → `.env.local`, y una consulta real contra cualquier lote.

## Notas para el merge

- **No se tocó `src/app/lotes/[id]/page.tsx`**, el único punto de fricción declarado con los equipos de Helada y Agronómico. El merge de esta rama no debería entrar en conflicto con ellos.
- Tampoco `spray-engine.ts`, `openmeteo.ts` ni `geo.ts`.
- Además de los tres archivos que listaba el reparto, se tocaron `config.ts` (umbrales y la documentación del punto C.4) e `index.ts` (el fallback de demo tiene que construir el campo nuevo) — ambos dentro de `src/lib/satelital/`. En tests, `riesgo.test.ts` sólo por el helper que construye observaciones.

## Pendiente que queda fuera de este paquete

`src/lib/riesgo.ts` filtra las observaciones por `ndvi !== null` y las pondera todas igual. Ahora que existe `confianza`, una lectura `baja` pesa lo mismo que una `alta` en el score de manejo. Es una decisión del equipo que tome riesgo, no de éste.
