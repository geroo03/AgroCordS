# Ventana de Aplicación

MVP de hackathon. Decide si se puede pulverizar un lote, hora por hora, durante las próximas 72 h.

## Correr la demo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. En la pantalla de lotes, "Cargar 3 lotes de ejemplo" crea Marcos Juárez, Río Cuarto y Villa María con pronóstico real, o dibujá un lote propio sobre el mapa satelital.

```bash
npm test        # 8 casos de borde del motor de decisión
npm run build   # build de producción
```

## Qué hace

- **Alta de lote** dibujando un polígono sobre imagen satelital (Leaflet + Geoman). Centroide y hectáreas con Turf.
- **Veredicto actual** por lote: "Aplicá ahora" / "Al límite" / "No apliques", con la razón limitante concreta.
- **Línea de tiempo de 72 h**, una franja por hora, coloreada y con marca de forma redundante (llena / rayada / borde) para daltonismo. Tocar una franja abre el detalle: Delta-T, viento, ráfagas, temperatura, humedad y razones con severidad.
- **Selector sistémico / contacto**: la misma hora puede cambiar de estado porque un producto de contacto necesita más horas sin lluvia (rain-fastness).
- **Ventanas recomendadas** (bloques de 2+ h aplicables, ordenadas por puntaje), solo hacia adelante.
- **Registro de aplicación** que congela el `HourAssessment` del momento como snapshot inmutable, e **historial** por lote.

## Decisiones de la demo

- **Sin capa de costes ni servicios con registro.** La persistencia es `localStorage` del navegador ([src/lib/almacen.ts](src/lib/almacen.ts)) en lugar de Supabase, y no hay autenticación. La interfaz del almacén imita las consultas que después harían `supabase-js` + RLS: cambiar de backend toca solo ese archivo. El SQL del esquema está en el blueprint (sección 5).
- **Clima**: Open-Meteo, sin API key, con caché de 30 min en el servidor. La API route (`GET /api/forecast?lat&lng&productType`) valida con Zod y devuelve las 72 horas evaluadas más las ventanas.
- **Motor de decisión** ([src/lib/spray-engine.ts](src/lib/spray-engine.ts)): funciones puras, umbrales Delta-T de GRDC/BoM adoptados por INTA. Provisto, no modificado. Ídem [src/lib/openmeteo.ts](src/lib/openmeteo.ts).
- **Zonas horarias**: las horas del pronóstico son cadenas ISO locales del lote y nunca se convierten a `Date`; la hora "actual" se busca comparando contra la hora local del servidor (en la demo, servidor y lote comparten zona).

## Aviso legal

La app informa condiciones meteorológicas y no reemplaza la receta fitosanitaria de un profesional matriculado. Los umbrales deben revisarse con un ingeniero agrónomo antes de presentarse como recomendación agronómica.

Datos meteorológicos de [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Imágenes satelitales de Esri, Maxar, Earthstar Geographics.
