# Ventana de Aplicación

App web móvil, freemium, con un propósito fijo: **decidir si se puede pulverizar un lote, ahora, en las próximas 72 h.** Eso es gratis, ilimitado, y es lo que se usa todos los días.

Premium agrega lo que cuesta dar y lo que vale más que la decisión diaria: **avisos automáticos** de cuándo se abre una ventana (para no tener que entrar a revisar), **vigor vegetativo real** por satélite (NDVI/NDRE, Sentinel-2) y un **score de manejo** pensado como insumo para seguros paramétricos o crédito agro. Ver [Modelo freemium](#modelo-freemium).

Premium se puede pagar con una **stablecoin de Twin Finance (ARGt/BRAt) sobre Base**: una interacción onchain real y verificable, no un mock. Ver [Pagos onchain](#pagos-onchain-twin-finance).

## Desarrollo en paralelo (en curso)

Hay 4 paquetes de trabajo repartidos en 4 ramas independientes, pensados para que 3 máquinas/cuentas distintas los tomen en paralelo desde `main` sin pisarse. Cada rama tiene su propio `TAREA.md` en la raíz, autocontenido — no hace falta más contexto que ese archivo para retomarlo en otra máquina.

| Rama | Módulos | Qué toca | Tiempo estimado |
|---|---|---|---|
| [`equipo1-nucleo-legal-poligonos`](../../tree/equipo1-nucleo-legal-poligonos) | Corrección de lenguaje legal en el veredicto + validaciones de polígono (auto-intersección, área máxima, solapamiento) | `Veredicto.tsx`, `geo.ts` | ~1-1,5 h |
| [`equipo2-satelital-m01`](../../tree/equipo2-satelital-m01) | Ajustes de la capa NDVI/NDRE: máscara de nubes, agregación temporal, campo de confianza explícito | `satelital/evalscript.ts`, `satelital/sentinelhub.ts`, `satelital/tipos.ts` | ~45 min-1 h |
| [`equipo3-helada-m07`](../../tree/equipo3-helada-m07) | Alerta de helada (nuevo): ajuste de temperatura de canopeo en noches radiativas, umbral por cultivo | nuevo `helada.ts`, sección en la pantalla de decisión | ~1,5-2 h |
| [`equipo3-agronomico-m03-m04`](../../tree/equipo3-agronomico-m03-m04) | Balance hídrico (índice de agotamiento) + grados día acumulados desde la siembra (nuevo) | nuevo `historico.ts`/`agronomico.ts`, campo `fechaSiembra` en `Lote`, pantalla `/lotes/[id]/agronomico` | ~2-2,5 h |

**Para retomar un paquete en otra máquina**: `git fetch && git checkout <rama>`, leé el `TAREA.md` de esa rama, y corré `npm install && npm test` antes de empezar (confirmá 50/50 en verde sobre la base antes de tocar nada). El único punto de fricción entre ramas es una línea de link en el header de `/lotes/[id]/page.tsx` — cada `TAREA.md` explica exactamente dónde agregarla para que el merge final sea trivial.

Quedan **fuera de este reparto** (necesitan infraestructura que el proyecto no tiene hoy — DB, cron, email, un rol de agrónomo revisor, o datos que todavía no existen): notificaciones con backend real, importación/exportación de lotes, predicción de rendimiento y detección de plagas. El detalle de por qué cada uno no entra está en `PRODUCTO.md`.

Esta sección se retira cuando las 4 ramas se integren a `main`.

## Correr la demo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. En la pestaña **Lotes**, "Cargar 3 lotes de ejemplo" crea Marcos Juárez, Río Cuarto y Villa María con pronóstico real, o dibujá un lote propio sobre el mapa satelital.

```bash
npm test        # motor (8) + satelital (21) + valor/score (10) + notificaciones (2) + pagos onchain (18, RPC mockeado)
npm run build   # build de producción
```

Para datos satelitales reales, copiá `.env.example` a `.env.local` y completá las credenciales de Sentinel Hub (ver [Datos satelitales](#datos-satelitales)). Para el pago Premium en stablecoin real, completá además las variables de Twin Finance (ver [Pagos onchain](#pagos-onchain-twin-finance)). Sin ninguna de las dos, la app funciona igual: NDVI usa datos de demostración y el paywall sólo ofrece la activación de demo, ambos marcados como tales.

## Navegación

Barra inferior fija de tres secciones ([BarraNavegacion.tsx](src/components/ui/BarraNavegacion.tsx)), estilo app móvil:

| Pestaña | Qué muestra |
|---|---|
| **Lotes** ([/lotes](src/app/lotes/page.tsx)) | Listado con miniatura satelital y estado actual por lote; alta dibujando un polígono nuevo. |
| **Ventanas** ([/ventanas](src/app/ventanas/page.tsx)) | Tablero agregado: las próximas ventanas de aplicación de todos los lotes juntas, ordenadas por la más próxima. |
| **Historial** ([/historial](src/app/historial/page.tsx)) | Todas las aplicaciones registradas, de todos los lotes, cada una expandible a sus condiciones congeladas. |

Cada lote además tiene su propia pantalla de decisión (`/lotes/[id]`) con tres vistas enlazadas desde el encabezado: **NDVI**, **Riesgo** (el score de manejo) y **Historial** por lote. NDVI y Riesgo son Premium: sin activar, muestran un paywall y no consultan Sentinel Hub — no se gasta cuota del proveedor por curiosidad.

## Modelo freemium

| | Gratis | Premium |
|---|---|---|
| Veredicto de aplicación, línea de tiempo 72 h, ventanas recomendadas | ✅ Ilimitado | ✅ |
| Registro de aplicaciones + historial (por lote y global) | ✅ Ilimitado | ✅ |
| Selector de producto en cascada (~34 principios activos) | ✅ | ✅ |
| 🔔 Avisos automáticos cuando se abre una ventana | — | ✅ |
| 🛰 Vigor vegetativo real (NDVI/NDRE, Sentinel-2) | — | ✅ |
| 📊 Score de manejo (insumo para seguro/crédito agro) | — | ✅ |

**"Activar Premium (demo)"** ([Paywall.tsx](src/components/ui/Paywall.tsx)) es una simulación explícita para la demo: pone una bandera en `localStorage` ([plan.ts](src/lib/plan.ts)), no hay checkout ni se piden datos de tarjeta. En producción sería una suscripción real validada en el servidor; la interfaz (`esPremium()` / `activarPremium()`) no cambiaría.

Al lado de ese botón, cuando hay contrato y wallet de destino configurados, aparece un segundo camino real: **"Pagar con ARGt" onchain** ([PagoOnchain.tsx](src/components/pagos/PagoOnchain.tsx)). La wallet del usuario firma una transferencia de verdad en Base; el servidor la verifica leyendo la red antes de activar Premium. Ver [Pagos onchain](#pagos-onchain-twin-finance).

**Por qué esos tres son los pagos, no una elección arbitraria:**
- **Avisos** automatizan lo que hoy el productor hace a mano (entrar y mirar) — valor de conveniencia claro y recurrente.
- **NDVI/NDRE** consumen cuota real y limitada de Sentinel Hub por cada consulta; gatearlo detrás de Premium es, además de un negocio, una necesidad técnica.
- **Score de manejo** es el dato que no existe hoy en el mercado de seguros/crédito agro de forma verificable — el activo más vendible a un tercero (aseguradora, banco), no sólo al productor.

Las notificaciones usan la Notification API del navegador ([notificaciones.ts](src/lib/notificaciones.ts)): avisan con la pestaña abierta o en segundo plano en el mismo dispositivo. Es un prototipo deliberado — producción necesitaría Web Push (service worker + VAPID + servidor) para avisar con la app cerrada.

## Qué hace

### Decisión de aplicación
- **Veredicto actual** por lote: "Aplicá ahora" / "Al límite" / "No apliques", con la razón limitante concreta.
- **Selector de producto en cascada** — Tipo (sistémico/contacto) → Principio activo → Nombre comercial ([SelectorProducto.tsx](src/components/registro/SelectorProducto.tsx)) — con buscador por nombre ([productos.ts](src/lib/productos.ts): ~34 principios activos, ~60 marcas de uso extendido en Argentina). La misma hora puede cambiar de estado porque un producto de contacto necesita más horas sin lluvia (rain-fastness).
- **Línea de tiempo de 72 h**, una franja por hora, coloreada y con marca de forma redundante (llena / rayada / borde) para daltonismo. Tocar una franja abre el detalle: Delta-T, viento, ráfagas, temperatura, humedad y razones con severidad.
- **Ventanas recomendadas** (bloques de 2+ h aplicables, ordenadas por puntaje), solo hacia adelante.
- **Registro de aplicación** que congela el `HourAssessment` del momento como snapshot inmutable, e **historial** por lote y global.

### Lotes
- **Alta dibujando un polígono** sobre imagen satelital (Leaflet + Geoman). Centroide y hectáreas con Turf; valida mínimo 4 vértices y 0,5 ha.
- **Miniatura satelital por lote** ([MiniaturaLote.tsx](src/components/mapa/MiniaturaLote.tsx)): imagen real (Esri World Imagery) con el polígono del lote dibujado encima, en listados, tarjetas de ventanas, historial y encabezados. Si falla la red, queda la silueta del polígono sobre fondo pizarra.

### Vigor vegetativo (NDVI/NDRE)
- Pantalla por lote (`/lotes/[id]/ndvi`) con vigor actual, NDVI/NDRE, fecha de la última observación y cobertura de nubes sobre el lote, más un gráfico con una entrada por pasada satelital y selección de fecha por chips tocables ([componentes](src/components/ndvi/)).
- **Datos reales de Sentinel-2** (Copernicus Data Space / Sentinel Hub) calculados sobre el polígono completo del lote — ver [Datos satelitales](#datos-satelitales). Sin credenciales, fallback de demostración marcado como tal.

### Valor económico y score de manejo (agro → fintech)
Puente entre lo agronómico y lo financiero ([riesgo.ts](src/lib/riesgo.ts)), construido enteramente sobre datos que la app ya produce — nada nuevo que consultar, nada inventado:

- **Valor económico de la decisión**, en el veredicto: compara el score de la hora actual con el de la mejor ventana de las próximas 72 h y lo traduce a pesos sobre las hectáreas reales del lote — "~$1.491.660 en juego" si aplicar ahora arriesga la inversión, o "sin pérdida de eficiencia estimada" si el momento ya es el mejor disponible.
- **Score de manejo** (`/lotes/[id]/riesgo`), 0-100: combina qué fracción de las aplicaciones registradas se hizo en condiciones aceptables u óptimas (dato congelado en cada `Aplicacion`, nunca recalculado) con la estabilidad del vigor NDVI real entre observaciones sin nubes. Es el tipo de dato que un seguro paramétrico o una línea de crédito agro usaría para tarificar riesgo — a mejor manejo medible, mejor perfil de riesgo.
- **Metodología ilustrativa, dicho explícitamente en la pantalla**: ni el costo por hectárea (`COSTO_PROMEDIO_HA_ARS`) ni los pesos del score son un modelo actuarial calibrado; son un punto de partida razonable para la demo, con el mismo criterio de honestidad que ya se aplica a los umbrales de `spray-engine.ts` y a los datos de NDVI/NDRE.
- **No decide nada**: ni el valor económico ni el score alteran o reemplazan el veredicto de `spray-engine.ts`. Son una reinterpretación de datos existentes, no un tercer motor.

### Pagos onchain (agro → fintech, track Twin Finance)
- **Premium se puede pagar con una stablecoin real de Twin Finance** (ARGt o BRAt) sobre la red Base ([lib/pagos/](src/lib/pagos/)): la wallet del usuario (MetaMask u otra) firma y transmite una transferencia ERC-20 de verdad; el servidor la verifica leyendo el recibo real desde el RPC público de Base antes de activar Premium — nunca confía en lo que el navegador reporta.
- **Interacción onchain real, no un mock**: hash de transacción, bloque, monto (con los decimales reales del token, leídos onchain) y link directo al explorer, verificables por cualquiera de forma independiente.
- **Módulo separado del resto de la app**: paga Premium, no interviene en `spray-engine.ts` ni en NDVI/riesgo. Ver [Pagos onchain](#pagos-onchain-twin-finance) para el detalle técnico y cómo configurarlo.

## Decisiones de la demo

- **Sin capa de costes ni servicios con registro.** La persistencia es `localStorage` del navegador ([almacen.ts](src/lib/almacen.ts)) en lugar de Supabase, y no hay autenticación. La interfaz del almacén imita las consultas que después harían `supabase-js` + RLS: cambiar de backend toca solo ese archivo. El SQL del esquema está en el blueprint (sección 5).
- **Clima**: Open-Meteo, sin API key, con caché de 30 min en el servidor. La API route (`GET /api/forecast?lat&lng&productType`) valida con Zod y devuelve las 72 horas evaluadas más las ventanas.
- **Motor de decisión** ([spray-engine.ts](src/lib/spray-engine.ts)): funciones puras, umbrales Delta-T de GRDC/BoM adoptados por INTA. Provisto, no modificado. Ídem [openmeteo.ts](src/lib/openmeteo.ts).
- **Zonas horarias**: las horas del pronóstico son cadenas ISO locales del lote y nunca se convierten a `Date`; la hora "actual" se busca comparando contra la hora local del servidor (en la demo, servidor y lote comparten zona).
- **Catálogo de productos curado, no exhaustivo**: la fuente oficial completa es el Registro Nacional de Terapéutica Vegetal de SENASA; el catálogo embebido cubre los de uso más extendido y el registro acepta texto libre para el resto.
- **Satélite y pulverización son módulos separados.** NDVI/NDRE describen el vigor del lote; no intervienen en la decisión de si se puede aplicar, que sigue siendo puramente meteorológica (`spray-engine.ts` no cambió).
- **Valor económico y score de manejo tampoco deciden nada.** Son una capa de lectura sobre datos ya existentes (`spray-engine.ts`, `applications`, NDVI); nunca retroalimentan al motor ni al satélite.
- **El pago onchain nunca custodia una clave privada.** Firma siempre la wallet del usuario, en su propia extensión; esta app arma la transacción y lee el recibo público, nada más. Sin `NEXT_PUBLIC_PAGOS_DESTINO` y al menos un contrato de token configurados, esa sección directamente no se renderiza — el paywall de demo sigue como único camino, igual que antes de este módulo.

Ver [PRODUCTO.md](PRODUCTO.md) para el detalle de qué problema resuelve cada función y la hoja de ruta completa (corto/mediano/largo plazo).

## Datos satelitales

La aplicación utiliza Sentinel-2 mediante Copernicus Data Space / Sentinel Hub para obtener observaciones de NDVI y NDRE sobre cada lote.

Las credenciales se configuran mediante:

```
SENTINELHUB_CLIENT_ID
SENTINELHUB_CLIENT_SECRET
```

Si no están configuradas o el proveedor no está disponible, la aplicación utiliza datos de demostración para mantener funcional la demo.

Cómo funciona:

- **Fuente**: Sentinel-2 L2A, consultado con la **Statistical API** de Sentinel Hub (sólo estadísticas sobre el polígono; no se descargan imágenes). Todo corre en el servidor: ni el secreto ni el token de acceso pasan por el navegador.
- **Índices** calculados por píxel con bandas Sentinel-2 y promediados sobre el lote: `NDVI = (B08 − B04) / (B08 + B04)` y `NDRE = (B08 − B05) / (B08 + B05)` (B04 rojo, B05 borde rojo 1, B08 NIR). Bandas y fórmulas documentadas en [evalscript.ts](src/lib/satelital/evalscript.ts) e [indices.ts](src/lib/satelital/indices.ts).
- **Observaciones reales, no interpoladas**: se muestran las fechas de adquisición que Sentinel-2 efectivamente tuvo en los últimos ~130 días. Una pasada dominada por nubes se conserva con valor `null` y se ve como un corte en la línea, nunca como un punto inventado. Si no hubo ninguna pasada útil, la pantalla lo dice.
- **Nubosidad**: se filtran escenas con más de `DEFAULT_MAX_CLOUD_COVERAGE` (30 %, [config.ts](src/lib/satelital/config.ts)) y, además, se calcula la cobertura **sobre el lote** píxel a píxel con la Scene Classification Layer; por debajo de `FRACCION_LIMPIA_MINIMA` de píxeles limpios no se informa valor. La máscara del [evalscript](src/lib/satelital/evalscript.ts) descarta las clases SCL sin dato, saturada, sombra de nube, nube media y alta, cirro y nieve, y también el píxel cuyo índice queda indefinido (`B08 + B04 = 0`), que si no contaminaría con `NaN` el promedio de toda la fecha. Sombra proyectada, agua y "no clasificado" se conservan a propósito: son estados reales del lote, no artefactos de la escena.
- **Confianza explícita por observación**: además de la cobertura de nubes, cada observación viaja con un nivel (`alta` / `media` / `baja` / `nula`) según qué fracción del lote quedó limpia. Existe porque el corte binario en `FRACCION_LIMPIA_MINIMA` no alcanzaba: un valor apoyado en el 51 % del lote y otro apoyado en el 99 % se mostraban idénticos. En la pantalla, el punto hueco de la serie y la leyenda de respaldo marcan la diferencia; la serie de demostración lo deja en `null`, porque en datos sintéticos no hay píxeles que contar.
- **Agregación temporal de un día** (`P1D`): es la unidad más fina de la Statistical API y la única que garantiza que ningún valor mezcle dos pasadas de fechas distintas. Cuando el lote cae sobre el solape de dos órbitas y una misma fecha vuelve partida en varios intervalos, se fusionan en **una** observación con las medias ponderadas por píxeles válidos — el satélite pasó una vez ese día y la serie tiene un punto, no dos.
- **Cache** en memoria del servidor (6 h, clave = hash del polígono + rango + umbral de nubes) en [cache.ts](src/lib/satelital/cache.ts); la interfaz permite cambiarlo por Redis/Supabase sin tocar el resto.
- **Fallback**: sin credenciales, o si Sentinel Hub falla (auth, red, límite de tasa, timeout), la serie vuelve con `fuente: "demo"`, `real: false` y una advertencia; el detalle del error queda en el log del servidor. La UI muestra "Fuente: Datos de demostración" de forma inconfundible.
- **Para cambiar de proveedor** basta con otro `consultarEstadisticas…` y ajustar a cuál llama [index.ts](src/lib/satelital/index.ts): tipos, API route y UI no cambian.

Obtener credenciales: crear una cuenta gratuita en [dataspace.copernicus.eu](https://dataspace.copernicus.eu/), entrar al *Sentinel Hub dashboard* → *User settings* → *OAuth clients* → *Create new*, y copiar el *Client ID* y el *Client secret* (se muestra una sola vez) a un archivo `.env.local` siguiendo [.env.example](.env.example). Reiniciar `npm run dev` después de crearlo.

Verificar que llegan datos reales: la pantalla `/lotes/[id]/ndvi` muestra **🛰 Sentinel-2 · Copernicus** con fecha de última observación y porcentaje de nubes; en la terminal del servidor no aparece la línea `[satelital] MISSING_CREDENTIALS`. Sin credenciales, la misma pantalla muestra **Fuente: Datos de demostración**.

## Pagos onchain (Twin Finance)

La app puede desbloquear Premium con un pago real en una stablecoin de [Twin Finance](https://www.twin.finance/) (ARGt, peso argentino; BRAt, real brasileño) sobre **Base**, aislado en [src/lib/pagos/](src/lib/pagos/) con el mismo criterio que la capa satelital: una única frontera con la red, sin dependencias nuevas (JSON-RPC vía `fetch`, sin `ethers`/`viem`/`wagmi`).

Las variables se configuran en `.env.local` (ver [.env.example](.env.example)):

```
NEXT_PUBLIC_PAGOS_RED          # "base" (mainnet) o "base-sepolia" (testnet)
NEXT_PUBLIC_PAGOS_DESTINO      # wallet de la demo que recibe el pago
NEXT_PUBLIC_ARGT_CONTRATO      # dirección del contrato ARGt en esa red
NEXT_PUBLIC_BRAT_CONTRATO      # opcional
```

A diferencia de las credenciales de Sentinel Hub, estas variables sí son `NEXT_PUBLIC_*` a propósito: una dirección de contrato o de wallet es información pública (cualquiera la ve en BaseScan), no un secreto, y el navegador la necesita para armar la transacción que el usuario firma. **Ninguna clave privada pasa nunca por esta app**: firma siempre la wallet del usuario.

Cómo funciona:

- **Flujo**: la wallet del usuario ([wallet.ts](src/lib/pagos/wallet.ts), sólo cliente) firma `transfer(destino, monto)` en el token elegido → el hash se envía a `POST /api/pagos/verificar` → el servidor ([verificarPago.ts](src/lib/pagos/verificarPago.ts)) lee el recibo real desde el RPC público de Base, decodifica el evento `Transfer`, confirma que el token y el destino son los configurados y que el monto alcanza el mínimo, leyendo los decimales reales del contrato onchain (nunca asumidos). Sólo entonces se activa Premium.
- **Selectores y topic de evento** ([erc20.ts](src/lib/pagos/erc20.ts)) son constantes universales del estándar ERC-20 (`transfer`, `decimals`, evento `Transfer`), verificadas calculando el hash Keccak-256 real antes de escribir el código, no de memoria.
- **Sin servicios con registro**: leer un recibo o llamar a una función `view` en una red pública EVM no requiere API key ni autenticación, a diferencia de Sentinel Hub.
- **Estados diferenciados** (`ComprobantePago.estado`): `verificado`, `no_configurado`, `hash_invalido`, `no_encontrado` (transitorio justo después de enviar, con reintento automático), `transaccion_fallida`, `token_incorrecto`, `destino_incorrecto`, `monto_insuficiente`, `error_red`. El usuario nunca ve un stack trace; el detalle técnico queda en el log del servidor.
- **Fallback**: sin `NEXT_PUBLIC_PAGOS_DESTINO` y al menos un contrato de token configurados, la sección de pago onchain no se renderiza — sólo queda "Activar Premium (demo)", que ya existía. Si el usuario cancela la firma en su wallet, o la verificación falla, el error se muestra sin romper la pantalla y se puede reintentar.
- **Monto de demostración**: `NEXT_PUBLIC_PAGOS_MONTO_DEMO` (por defecto 1 unidad del token). No es un precio de producción calibrado, mismo criterio de honestidad que `COSTO_PROMEDIO_HA_ARS` en `riesgo.ts`.

Conseguir las direcciones de contrato reales: Twin Finance no publica un explorador de contratos en su sitio; se solicitan por su [formulario de contacto](https://www.twin.finance/contact) o [Discord](https://discord.gg/XUcnRma9E3), o vienen provistas por la documentación del track del hackathon. **Nunca copiar una dirección de un resultado de búsqueda sin verificarla en [BaseScan](https://basescan.org)** — una dirección de contrato equivocada mueve fondos reales a un destino que no es el esperado.

Para probar sin arriesgar fondos reales: usar `NEXT_PUBLIC_PAGOS_RED=base-sepolia` (testnet de Base) con una wallet cargada de ETH y del token de prueba correspondiente en esa red, si Twin Finance ofrece un despliegue de testnet para el track.

Verificar que la interacción es real: al pagar, la pantalla del paywall muestra el hash de la transacción y, una vez verificada, un link directo a BaseScan — cualquiera puede abrirlo y confirmar la transferencia por sí mismo, independientemente de esta app.

## Aviso legal

La app informa condiciones meteorológicas y no reemplaza la receta fitosanitaria de un profesional matriculado. Los umbrales deben revisarse con un ingeniero agrónomo antes de presentarse como recomendación agronómica. Los umbrales de vigor (NDVI) son orientativos y varían por cultivo y etapa; cuando la app corre sin credenciales satelitales, los valores de NDVI/NDRE son de demostración y la pantalla lo indica.

Cuando el pago onchain está configurado en `base` (mainnet, no testnet), la transferencia mueve valor real y **una transacción confirmada en una blockchain no se puede revertir**: no hay reembolso posible desde esta app. Verificar siempre la dirección de destino contra una fuente oficial antes de configurarla.

Datos meteorológicos de [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Datos de NDVI/NDRE derivados de Sentinel-2 (Copernicus, Unión Europea). Imágenes de fondo de Esri, Maxar, Earthstar Geographics. Pagos onchain sobre la red [Base](https://base.org/) con stablecoins de [Twin Finance](https://www.twin.finance/).
