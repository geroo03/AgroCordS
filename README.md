# Ventana de Aplicación

Plataforma de inteligencia agronómica: transforma datos meteorológicos, satelitales e históricos en **una conclusión clara sobre cada lote**. El productor abre la app, mira diez segundos y sabe qué está pasando, qué riesgo hay y qué conviene evaluar; el agrónomo abre la evidencia que sostiene esa conclusión.

La pulverización es la puerta de entrada — un problema concreto, frecuente y diario — y sigue siendo gratis e ilimitada, pero ya no es el único objetivo.

Premium agrega lo que cuesta dar y lo que vale más que la decisión diaria: **avisos automáticos** de cuándo se abre una ventana (para no tener que entrar a revisar), **vigor vegetativo real** por satélite (NDVI/NDRE, Sentinel-2) y un **score de manejo** pensado como insumo para seguros paramétricos o crédito agro. Ver [Modelo freemium](#modelo-freemium).

Premium se puede pagar con una **stablecoin de Twin Finance (ARGt/BRAt) sobre Base**: una interacción onchain real y verificable, no un mock. Ver [Pagos onchain](#pagos-onchain-twin-finance).

## Correr la demo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. En la pestaña **Lotes**, "Cargar 3 lotes de ejemplo" crea Marcos Juárez, Río Cuarto y Villa María con pronóstico real, o dibujá un lote propio sobre el mapa satelital.

```bash
npm test        # 111 en total: satelital (21) + pagos onchain (18) + síntesis (15) + geo (11) + valor/score (10) + asistente (17) + motor (8) + helada (5) + agronómico (4) + notificaciones (2)
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

Cada lote además tiene su propia pantalla de decisión (`/lotes/[id]`) con cuatro vistas enlazadas desde el encabezado: **NDVI**, **Riesgo** (el score de manejo), **Historial** por lote y **Agronómico** (grados día y agotamiento hídrico). NDVI y Riesgo son Premium: sin activar, muestran un paywall y no consultan Sentinel Hub — no se gasta cuota del proveedor por curiosidad.

## Modelo freemium

| | Gratis | Premium |
|---|---|---|
| Veredicto de aplicación, línea de tiempo 72 h, ventanas recomendadas | ✅ Ilimitado | ✅ |
| Registro de aplicaciones + historial (por lote y global) | ✅ Ilimitado | ✅ |
| Selector de producto en cascada (~34 principios activos) | ✅ | ✅ |
| 🔔 Avisos automáticos cuando se abre una ventana | — | ✅ |
| 🛰 Vigor vegetativo real (NDVI/NDRE, Sentinel-2) | — | ✅ |
| 📊 Score de manejo (insumo para seguro/crédito agro) | — | ✅ |
| 🤖 Asistente conversacional del lote | 5 consultas/día | ✅ Ilimitado |

**"Activar Premium (demo)"** ([Paywall.tsx](src/components/ui/Paywall.tsx)) es una simulación explícita para la demo: pone una bandera en `localStorage` ([plan.ts](src/lib/plan.ts)), no hay checkout ni se piden datos de tarjeta. En producción sería una suscripción real validada en el servidor; la interfaz (`esPremium()` / `activarPremium()`) no cambiaría.

Al lado de ese botón, cuando hay contrato y wallet de destino configurados, aparece un segundo camino real: **"Pagar con ARGt" onchain** ([PagoOnchain.tsx](src/components/pagos/PagoOnchain.tsx)). La wallet del usuario firma una transferencia de verdad en Base; el servidor la verifica leyendo la red antes de activar Premium. Ver [Pagos onchain](#pagos-onchain-twin-finance).

**Por qué esos tres son los pagos, no una elección arbitraria:**
- **Avisos** automatizan lo que hoy el productor hace a mano (entrar y mirar) — valor de conveniencia claro y recurrente.
- **NDVI/NDRE** consumen cuota real y limitada de Sentinel Hub por cada consulta; gatearlo detrás de Premium es, además de un negocio, una necesidad técnica.
- **Score de manejo** es el dato que no existe hoy en el mercado de seguros/crédito agro de forma verificable — el activo más vendible a un tercero (aseguradora, banco), no sólo al productor.

**El asistente conversacional** no es todo o nada como los otros tres: da 5 consultas gratis por día (consume cuota real del proveedor de IA en cada respuesta) y de ahí en más pide Premium, igual que el resto — conveniencia diaria gratis, uso intensivo pago.

Las notificaciones usan la Notification API del navegador ([notificaciones.ts](src/lib/notificaciones.ts)): avisan con la pestaña abierta o en segundo plano en el mismo dispositivo. Es un prototipo deliberado — producción necesitaría Web Push (service worker + VAPID + servidor) para avisar con la app cerrada.

## Qué hace

### Diagnóstico del lote (la conclusión, primero)
Una capa de síntesis ([sintesis.ts](src/lib/sintesis.ts)) lee lo que ya produjeron los motores —pulverización, helada, balance hídrico, vigor satelital— y responde en el orden en que hace falta: **qué pasa, qué cambió, qué conviene evaluar y con qué evidencia**. No calcula agronomía por su cuenta ni corrige a ningún motor.

- **Un estado y un titular arriba de todo**: situación favorable / atención / riesgo, siempre con la palabra al lado del color. El peor hallazgo manda.
- **Un bloque por categoría** (aplicación, agua y estrés, riesgo climático, estado del cultivo) con su interpretación y, cuando corresponde, **qué conviene evaluar**.
- **La evidencia a un toque**: cada bloque abre los datos crudos que lo sustentan, para el usuario técnico.
- **Señal cruzada**: cuando la reserva de agua cede y el vigor cae en la misma ventana, las dos señales se leen juntas y la conclusión sube de tono — el caso que justifica la capa, porque por separado cada indicador puede verse tolerable.
- **Sin datos suficientes se dice explícitamente**, con el motivo por categoría. Nunca se concluye sobre un hueco: una conclusión apoyada en nada suena igual de segura que una apoyada en evidencia.

Tres registros de lenguaje separados a propósito, y esa separación es la razón de ser del módulo:

| | Ejemplo |
|---|---|
| **Información** | "Se esperan mínimas de 0,8 °C." |
| **Interpretación** | "Compatible con riesgo de helada para el cultivo declarado." |
| **Acción a evaluar** | "Conviene evaluar medidas de protección y monitoreo del lote." |

Nunca una instrucción de aplicar, sembrar o regar: la decisión agronómica sigue siendo del profesional matriculado (Ley provincial 9164). Hay una prueba que lo verifica sobre todos los escenarios.

### Decisión de aplicación
- **Veredicto actual** por lote: "Condiciones favorables" / "Al límite" / "Condiciones no favorables", con la razón limitante concreta. Describe condiciones, nunca instruye aplicar o no: esa decisión es del profesional matriculado (Ley provincial 9164).
- **Selector de producto en cascada** — Tipo (sistémico/contacto) → Principio activo → Nombre comercial ([SelectorProducto.tsx](src/components/registro/SelectorProducto.tsx)) — con buscador por nombre ([productos.ts](src/lib/productos.ts): ~34 principios activos, ~60 marcas de uso extendido en Argentina). La misma hora puede cambiar de estado porque un producto de contacto necesita más horas sin lluvia (rain-fastness).
- **Línea de tiempo de 72 h**, una franja por hora, coloreada y con marca de forma redundante (llena / rayada / borde) para daltonismo. Tocar una franja abre el detalle: Delta-T, viento, ráfagas, temperatura, humedad y razones con severidad.
- **Ventanas recomendadas** (bloques de 2+ h aplicables, ordenadas por puntaje), solo hacia adelante.
- **Registro de aplicación** que congela el `HourAssessment` del momento como snapshot inmutable, e **historial** por lote y global.

### Lotes
- **Alta dibujando un polígono** sobre imagen satelital (Leaflet + Geoman). Centroide y hectáreas con Turf; valida mínimo 4 vértices, entre 0,5 y 5.000 ha, que el polígono no se cruce a sí mismo y que no se superponga más de un 10% con un lote ya cargado (casi siempre es el mismo lote dibujado dos veces).
- **Miniatura satelital por lote** ([MiniaturaLote.tsx](src/components/mapa/MiniaturaLote.tsx)): imagen real (Esri World Imagery) con el polígono del lote dibujado encima, en listados, tarjetas de ventanas, historial y encabezados. Si falla la red, queda la silueta del polígono sobre fondo pizarra.

### Vigor vegetativo (NDVI/NDRE)
- Pantalla por lote (`/lotes/[id]/ndvi`) con vigor actual, NDVI/NDRE, fecha de la última observación y cobertura de nubes sobre el lote, más un gráfico con una entrada por pasada satelital y selección de fecha por chips tocables ([componentes](src/components/ndvi/)).
- **Datos reales de Sentinel-2** (Copernicus Data Space / Sentinel Hub) calculados sobre el polígono completo del lote — ver [Datos satelitales](#datos-satelitales). Sin credenciales, fallback de demostración marcado como tal.

### Riesgo de helada (informativo, gratis)
- Tarjeta en la pantalla del lote ([helada.ts](src/lib/helada.ts)): estima la temperatura del **canopeo**, no la de la garita meteorológica. En noche despejada y calma (nubosidad < 30 %, viento < 8 km/h) el enfriamiento radiativo deja el cultivo unos 3 °C por debajo de la temperatura a 2 m que informa el pronóstico; alertar con el número crudo produce falsos negativos justo cuando más importa.
- Umbral por cultivo: trigo −4 °C, soja y maíz 0 °C. Es un umbral genérico, sin ajustar por etapa fenológica: la app no conoce el estadio del lote y lo dice en pantalla.
- Se calcula al abrir la pantalla y **no es un aviso automático en segundo plano**: sin backend no se puede prometer un aviso a las 3 de la mañana, y la tarjeta lo aclara. No interviene en el veredicto de pulverización — son módulos separados.

### Balance agronómico: grados día y agua (gratis)
- Pantalla por lote con **grados día acumulados** desde la fecha de siembra (método modificado con techo: maíz y soja base 10 °C / techo 30 °C, trigo 0 °C / 26 °C) y un **índice de agotamiento hídrico** de 0 a 1 por balance de balde con ET0 de FAO-56.
- Datos reales de la **Archive API de Open-Meteo** ([historico.ts](src/lib/historico.ts)), sin API key, que ya entrega la evapotranspiración calculada.
- Se informa el índice 0-1 y **nunca milímetros absolutos**: el agua útil depende del suelo de cada lote y la app no tiene ese dato, así que un milimetraje fingiría una precisión que no existe. El supuesto (175 mm a capacidad de campo, Kc fijo) está escrito en la propia pantalla.
- Sin fecha de siembra cargada, la pantalla la pide en vez de inventar un ciclo. No se construyó la comparación contra el promedio histórico de la zona: necesitaría diez campañas por zona agrupadas.

### Valor económico y score de manejo (agro → fintech)
Puente entre lo agronómico y lo financiero ([riesgo.ts](src/lib/riesgo.ts)), construido enteramente sobre datos que la app ya produce — nada nuevo que consultar, nada inventado:

- **Valor económico de la decisión**, en el veredicto: compara el score de la hora actual con el de la mejor ventana de las próximas 72 h y lo traduce a pesos sobre las hectáreas reales del lote — "~$1.491.660 en juego" si aplicar ahora arriesga la inversión, o "sin pérdida de eficiencia estimada" si el momento ya es el mejor disponible.
- **Score de manejo** (`/lotes/[id]/riesgo`), 0-100: combina qué fracción de las aplicaciones registradas se hizo en condiciones aceptables u óptimas (dato congelado en cada `Aplicacion`, nunca recalculado) con la estabilidad del vigor NDVI real entre observaciones sin nubes. Es el tipo de dato que un seguro paramétrico o una línea de crédito agro usaría para tarificar riesgo — a mejor manejo medible, mejor perfil de riesgo.
- **Metodología ilustrativa, dicho explícitamente en la pantalla**: ni el costo por hectárea (`COSTO_PROMEDIO_HA_ARS`) ni los pesos del score son un modelo actuarial calibrado; son un punto de partida razonable para la demo, con el mismo criterio de honestidad que ya se aplica a los umbrales de `spray-engine.ts` y a los datos de NDVI/NDRE.
- **No decide nada**: ni el valor económico ni el score alteran o reemplazan el veredicto de `spray-engine.ts`. Son una reinterpretación de datos existentes, no un tercer motor.

### Asistente conversacional del lote (Groq)
- **Botón flotante en la pantalla de decisión** ([BotonChat.tsx](src/components/chat/BotonChat.tsx)) que abre un chat contextual a ESE lote — no una pestaña aparte ni un asistente genérico.
- **Contexto real, no inventado**: el chat manda a Groq el mismo `Diagnostico` que ya ve el usuario en pantalla ([sintesis.ts](src/lib/sintesis.ts)), más el valor económico y las últimas aplicaciones registradas ([contexto.ts](src/lib/chat/contexto.ts)). Nunca vuelve a consultar clima, satélite ni balance hídrico por su cuenta — si el diagnóstico en pantalla dice una cosa, el chat no puede decir otra.
- **Foco en acciones sugeridas**: la respuesta separa un texto libre de una lista corta de acciones concretas (`{"respuesta", "acciones"}`, JSON mode de Groq validado con Zod), mostradas aparte en la burbuja del asistente.
- **Multi-turno en memoria de la sesión**: la conversación se pierde al recargar la página, sin persistencia todavía.
- **5 consultas gratis por día**, por dispositivo ([limite.ts](src/lib/chat/limite.ts), localStorage, mismo modelo de confianza que `plan.ts`); a partir de la 6ª pide Premium.
- **Mismo límite legal que el resto de la app**: describe y sugiere qué evaluar, nunca instruye una receta fitosanitaria — el propio prompt del sistema lo dice explícitamente ([groq.ts](src/lib/chat/groq.ts)).
- Ver [Asistente conversacional](#asistente-conversacional-groq) para cómo configurarlo.

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
- **El asistente tampoco recalcula agronomía.** Lee el `Diagnostico` ya calculado ([sintesis.ts](src/lib/sintesis.ts)) y lo conversa en lenguaje natural; nunca vuelve a consultar clima, satélite ni balance hídrico por su cuenta ni le agrega datos que ese diagnóstico no tenga.
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
- **Nubosidad**: se filtran escenas con más de `DEFAULT_MAX_CLOUD_COVERAGE` (30 %, [config.ts](src/lib/satelital/config.ts)) y, además, se calcula la cobertura **sobre el lote** píxel a píxel con la Scene Classification Layer; por debajo de `FRACCION_LIMPIA_MINIMA` (50 %, más estricto que el 40 % de un spec de referencia — la decisión está documentada en `config.ts`) no se informa valor. La máscara del [evalscript](src/lib/satelital/evalscript.ts) descarta las clases SCL sin dato, saturada, sombra de nube, nube media y alta, cirro y nieve, y también el píxel cuyo índice queda indefinido (`B08 + B04 = 0`), que si no contaminaría con `NaN` el promedio de toda la fecha. Sombra proyectada, agua y "no clasificado" se conservan a propósito: son estados reales del lote, no artefactos de la escena.
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

## Asistente conversacional (Groq)

El asistente del lote usa [Groq](https://groq.com/) (API compatible con OpenAI, sin API key propia de streaming necesaria) para responder en lenguaje natural sobre el diagnóstico que la app ya calculó.

La credencial se configura mediante:

```
GROQ_API_KEY
```

Sin esta variable, `POST /api/chat` devuelve 503 y la pantalla del chat lo muestra como un error reintentable — mismo criterio que cuando Open-Meteo no responde. No hay fallback de demostración para el chat: a diferencia de NDVI, una respuesta de chatbot inventada sería peor que no tener chat.

Cómo funciona:

- **Única frontera con el proveedor** ([groq.ts](src/lib/chat/groq.ts)): arma el prompt, llama a `POST https://api.groq.com/openai/v1/chat/completions` con `fetch` (sin SDK nueva, mismo criterio que `pagos/rpc.ts`), y valida la respuesta con Zod antes de devolverla. Cambiar de proveedor de LLM toca sólo este archivo.
- **Modelo**: `llama-3.3-70b-versatile` por defecto, configurable con `GROQ_MODEL` opcional.
- **JSON forzado**: el system prompt exige `{"respuesta": string, "acciones": string[]}` (`response_format: json_object`); si Groq devuelve otra forma, la API route responde 503 en vez de mostrar un JSON roto.
- **Nunca inventa datos**: el prompt de sistema instruye usar sólo el contexto del lote que se le pasa (el mismo `Diagnostico` de la pantalla) y decir explícitamente cuando un dato no está disponible.
- **Límite de 5 consultas gratis por día** aplicado en el cliente ([limite.ts](src/lib/chat/limite.ts)) — sin backend ni cuentas, es el mismo modelo de confianza que el resto del Paywall de demo.

Obtener una API key: crear una cuenta gratuita en [console.groq.com](https://console.groq.com/), generar una API key, y copiarla a `.env.local` siguiendo [.env.example](.env.example). Reiniciar `npm run dev` después de crearla.

## Aviso legal

La app informa condiciones meteorológicas y no reemplaza la receta fitosanitaria de un profesional matriculado. Los umbrales deben revisarse con un ingeniero agrónomo antes de presentarse como recomendación agronómica. Los umbrales de vigor (NDVI) son orientativos y varían por cultivo y etapa; cuando la app corre sin credenciales satelitales, los valores de NDVI/NDRE son de demostración y la pantalla lo indica.

Cuando el pago onchain está configurado en `base` (mainnet, no testnet), la transferencia mueve valor real y **una transacción confirmada en una blockchain no se puede revertir**: no hay reembolso posible desde esta app. Verificar siempre la dirección de destino contra una fuente oficial antes de configurarla.

Datos meteorológicos de [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Datos de NDVI/NDRE derivados de Sentinel-2 (Copernicus, Unión Europea). Imágenes de fondo de Esri, Maxar, Earthstar Geographics. Pagos onchain sobre la red [Base](https://base.org/) con stablecoins de [Twin Finance](https://www.twin.finance/).
