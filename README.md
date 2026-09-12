# Ventana de Aplicación

App web móvil (hackathon → en evolución). Decide si se puede pulverizar un lote, hora por hora, durante las próximas 72 h, y suma un módulo de vigor vegetativo (NDVI/NDRE) por lote.

## Correr la demo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. En la pestaña **Lotes**, "Cargar 3 lotes de ejemplo" crea Marcos Juárez, Río Cuarto y Villa María con pronóstico real, o dibujá un lote propio sobre el mapa satelital.

```bash
npm test        # motor de decisión (8 casos) + capa satelital (12 casos, con Sentinel Hub mockeado)
npm run build   # build de producción
```

Para datos satelitales reales, copiá `.env.example` a `.env.local` y completá las credenciales de Sentinel Hub (ver [Datos satelitales](#datos-satelitales)). Sin ellas la app funciona igual, con datos de demostración marcados como tales.

## Navegación

Barra inferior fija de tres secciones ([BarraNavegacion.tsx](src/components/ui/BarraNavegacion.tsx)), estilo app móvil:

| Pestaña | Qué muestra |
|---|---|
| **Lotes** ([/lotes](src/app/lotes/page.tsx)) | Listado con miniatura satelital y estado actual por lote; alta dibujando un polígono nuevo. |
| **Ventanas** ([/ventanas](src/app/ventanas/page.tsx)) | Tablero agregado: las próximas ventanas de aplicación de todos los lotes juntas, ordenadas por la más próxima. |
| **Historial** ([/historial](src/app/historial/page.tsx)) | Todas las aplicaciones registradas, de todos los lotes, cada una expandible a sus condiciones congeladas. |

Cada lote además tiene su propia pantalla de decisión (`/lotes/[id]`) con dos vistas enlazadas desde el encabezado: **Historial** por lote y **NDVI**.

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

## Decisiones de la demo

- **Sin capa de costes ni servicios con registro.** La persistencia es `localStorage` del navegador ([almacen.ts](src/lib/almacen.ts)) en lugar de Supabase, y no hay autenticación. La interfaz del almacén imita las consultas que después harían `supabase-js` + RLS: cambiar de backend toca solo ese archivo. El SQL del esquema está en el blueprint (sección 5).
- **Clima**: Open-Meteo, sin API key, con caché de 30 min en el servidor. La API route (`GET /api/forecast?lat&lng&productType`) valida con Zod y devuelve las 72 horas evaluadas más las ventanas.
- **Motor de decisión** ([spray-engine.ts](src/lib/spray-engine.ts)): funciones puras, umbrales Delta-T de GRDC/BoM adoptados por INTA. Provisto, no modificado. Ídem [openmeteo.ts](src/lib/openmeteo.ts).
- **Zonas horarias**: las horas del pronóstico son cadenas ISO locales del lote y nunca se convierten a `Date`; la hora "actual" se busca comparando contra la hora local del servidor (en la demo, servidor y lote comparten zona).
- **Catálogo de productos curado, no exhaustivo**: la fuente oficial completa es el Registro Nacional de Terapéutica Vegetal de SENASA; el catálogo embebido cubre los de uso más extendido y el registro acepta texto libre para el resto.
- **Satélite y pulverización son módulos separados.** NDVI/NDRE describen el vigor del lote; no intervienen en la decisión de si se puede aplicar, que sigue siendo puramente meteorológica (`spray-engine.ts` no cambió).

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
- **Nubosidad**: se filtran escenas con más de `DEFAULT_MAX_CLOUD_COVERAGE` (30 %, [config.ts](src/lib/satelital/config.ts)) y, además, se calcula la cobertura **sobre el lote** píxel a píxel con la Scene Classification Layer; por debajo de `FRACCION_LIMPIA_MINIMA` de píxeles limpios no se informa valor.
- **Cache** en memoria del servidor (6 h, clave = hash del polígono + rango + umbral de nubes) en [cache.ts](src/lib/satelital/cache.ts); la interfaz permite cambiarlo por Redis/Supabase sin tocar el resto.
- **Fallback**: sin credenciales, o si Sentinel Hub falla (auth, red, límite de tasa, timeout), la serie vuelve con `fuente: "demo"`, `real: false` y una advertencia; el detalle del error queda en el log del servidor. La UI muestra "Fuente: Datos de demostración" de forma inconfundible.
- **Para cambiar de proveedor** basta con otro `consultarEstadisticas…` y ajustar a cuál llama [index.ts](src/lib/satelital/index.ts): tipos, API route y UI no cambian.

Obtener credenciales: crear una cuenta gratuita en [dataspace.copernicus.eu](https://dataspace.copernicus.eu/), entrar al *Sentinel Hub dashboard* → *User settings* → *OAuth clients* → *Create new*, y copiar el *Client ID* y el *Client secret* (se muestra una sola vez) a un archivo `.env.local` siguiendo [.env.example](.env.example). Reiniciar `npm run dev` después de crearlo.

Verificar que llegan datos reales: la pantalla `/lotes/[id]/ndvi` muestra **🛰 Sentinel-2 · Copernicus** con fecha de última observación y porcentaje de nubes; en la terminal del servidor no aparece la línea `[satelital] MISSING_CREDENTIALS`. Sin credenciales, la misma pantalla muestra **Fuente: Datos de demostración**.

## Aviso legal

La app informa condiciones meteorológicas y no reemplaza la receta fitosanitaria de un profesional matriculado. Los umbrales deben revisarse con un ingeniero agrónomo antes de presentarse como recomendación agronómica. Los umbrales de vigor (NDVI) son orientativos y varían por cultivo y etapa; cuando la app corre sin credenciales satelitales, los valores de NDVI/NDRE son de demostración y la pantalla lo indica.

Datos meteorológicos de [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Datos de NDVI/NDRE derivados de Sentinel-2 (Copernicus, Unión Europea). Imágenes de fondo de Esri, Maxar, Earthstar Geographics.
