# Ventana de Aplicación — funciones, problemas que resuelve y próximos pasos

Decide si se puede pulverizar un lote, hora por hora, durante las próximas 72 h. Pensada para un teléfono, al sol, con una mano: una respuesta en dos segundos, con la razón concreta al lado.

---

## Problemas que soluciona

| Problema real | Cómo lo ataca la app |
|---|---|
| **La decisión de aplicar se toma a ojo.** El productor mira el viento y decide, pero la calidad de una aplicación depende de al menos seis variables que interactúan (viento, ráfagas, Delta-T, temperatura, humedad, lluvia próxima). | Un motor de decisión evalúa cada hora con umbrales explícitos y devuelve un veredicto único con su razón limitante: "No apliques — Viento de 24 km/h". |
| **La deriva daña lotes vecinos y genera conflictos y sanciones.** El viento excesivo es conocido; el aire *demasiado quieto* (deriva por suspensión) y la inversión térmica nocturna casi nunca se consideran. | El motor bloquea tanto por viento excesivo como insuficiente, y detecta condiciones compatibles con inversión térmica (noche + calma + cielo despejado) con criterio conservador. |
| **Se pierde producto y plata por evaporación y lavado.** Aplicar con Delta-T alto evapora la gota antes de llegar al objetivo; una lluvia a las pocas horas lava un producto de contacto. Cada tanque desperdiciado son cientos de dólares. | Delta-T calculado hora por hora (aproximación de Stull) y ventana libre de lluvia según el tipo de producto: un sistémico necesita 1 h sin lluvia, un contacto 4 h. La misma hora puede ser verde para uno y roja para el otro. |
| **"¿Y si espero?" no tiene respuesta fácil.** Saber que ahora no se puede es la mitad del problema; la otra mitad es saber cuándo sí. | Línea de tiempo de 72 h coloreada hora por hora y ventanas recomendadas (bloques de 2+ h aplicables) ordenadas por calidad, solo hacia adelante. |
| **El registro de aplicaciones es papel, memoria o nada.** Ante un reclamo, una inspección o una auditoría de buenas prácticas, no hay evidencia de las condiciones al momento de aplicar. | Cada aplicación registrada congela el estado meteorológico completo del momento (snapshot inmutable): aunque después cambien los umbrales del motor, el registro histórico no se altera. Es un registro de cumplimiento, no un cálculo recalculable. |
| **Las herramientas agro suelen ser dashboards de escritorio.** El que decide está arriba de la camioneta, no en la oficina. | Móvil primero: una columna, tipografía grande, toques de 44 px, color nunca como único código (marcas de forma para daltonismo), estados de carga y error en toda pantalla. |

---

## Funciones del MVP

### Navegación (app web móvil)
- **Tres secciones con barra inferior fija**, estilo app nativa: **Lotes** (listado y alta), **Ventanas** (cuándo aplicar en cada lote, agregado de todos los lotes) e **Historial** (todas las aplicaciones registradas). Pestaña activa señalada, toques de 44+ px, `safe-area-inset` para teléfonos con notch.
- **Ventanas**: cada lote muestra sus próximas ventanas ordenadas cronológicamente, con selector sistémico/contacto que recalcula todo el tablero.
- **Miniatura satelital por lote**: imagen satelital estática real (Esri World Imagery) con el polígono del lote dibujado encima, en el listado, en las ventanas, en el historial y en el encabezado de la pantalla de decisión. Si no hay red, queda la silueta del polígono sobre fondo pizarra: la forma del lote siempre se ve.

### NDVI y NDRE (por lote)
- Nueva pantalla por lote (enlazada junto a "Historial" en el detalle) con **vigor actual** ("Vigor alto/medio/bajo", nunca solo color), valores de **NDVI y NDRE**, y un **gráfico de la serie temporal** de ~130 días con líneas coloreadas por índice (paleta validada contra daltonismo, ΔE ≥ 15) y umbrales de vigor marcados como referencia.
- Selección de fecha mediante chips tocables (mismo patrón que la línea de tiempo horaria): tocar una fecha actualiza el detalle con NDVI, NDRE y una lectura interpretativa breve (por ejemplo, NDRE muy por debajo de NDVI puede señalar estrés que NDVI todavía no muestra por estar saturado).
- Explicación siempre visible de qué mide cada índice y por qué NDRE complementa a NDVI en etapas avanzadas del cultivo.
- **Datos reales de Sentinel-2** vía Copernicus Data Space / Sentinel Hub (Statistical API sobre el polígono completo del lote, `src/lib/satelital/`): NDVI y NDRE por píxel con bandas B04/B05/B08, máscara de nubes con la Scene Classification Layer, una observación por pasada real (sin interpolar), cobertura de nubes sobre el lote, cache de 6 h. La pantalla muestra siempre la fuente: **Sentinel-2 · Copernicus** o **Datos de demostración** (fallback cuando no hay credenciales o el proveedor falla), de forma inconfundible.

### Lotes
- Alta de lote **dibujando el polígono sobre imagen satelital** (Leaflet + Geoman, en español, herramienta activa por defecto).
- Cálculo automático de **centroide y hectáreas** (Turf); validación de polígono (mínimo 4 vértices y 0,5 ha).
- Listado de lotes con **punto de estado actual** por lote (verde / ámbar / rojo con etiqueta en palabras).
- Botón de **3 lotes de ejemplo** (Marcos Juárez, Río Cuarto, Villa María) para demo instantánea con pronóstico real.

### Decisión
- **Veredicto grande** con el estado actual y la razón limitante en una línea ("Aplicá ahora" / "Al límite" / "No apliques").
- **Selector de producto en tres niveles en cascada**: Tipo de producto (sistémico / contacto) → Principio activo → Nombre comercial, con **búsqueda por nombre** que completa los tres niveles de una vez (buscar "Karate" selecciona Contacto → Lambdacialotrina → Karate Zeon y reconsulta el motor). El tipo alimenta la evaluación de rain-fastness; los otros dos niveles documentan qué se aplica.
- **Catálogo curado** (`src/lib/productos.ts`): ~34 principios activos y ~60 marcas comerciales de uso extendido en cultivos extensivos argentinos, agrupados por herbicidas / insecticidas / fungicidas, excluyendo productos prohibidos (paraquat, clorpirifos). La selección prellena el campo de producto del registro.
- **Línea de tiempo de 72 h**: una franja por hora agrupada por día, coloreada por estado con marca de forma redundante (llena / rayada / borde) y horas pasadas atenuadas. Cada franja es un botón accesible con etiqueta.
- **Detalle por hora**: Delta-T, viento, ráfagas, temperatura, humedad, lluvia, y la lista de razones con severidad (bloqueo / advertencia / info).
- **Ventanas recomendadas**: hasta 3 bloques de horas consecutivas aplicables, ordenadas por puntaje, con duración y mejor condición. Tocarlas navega a esa hora.

### Registro
- **Registro de aplicación** con producto, tipo y notas, que congela el `HourAssessment` completo del momento.
- **Historial por lote** con cada aplicación expandible a sus condiciones congeladas.

### Motor de decisión (`src/lib/spray-engine.ts`)
- Funciones puras, sin I/O, 100% testeables y auditables por un agrónomo. 8 casos de borde en verde.
- Umbrales centralizados en `THRESHOLDS` (basados en guías Delta-T de GRDC/BoM, adoptadas por INTA): viento 3–20 km/h con franja ideal 6–15, ráfagas máx. 25, Delta-T ideal 2–8, inversión térmica, rain-fastness por producto.
- Puntaje 0–100 por hora con bloqueos absolutos: cualquier razón de severidad `blocker` fuerza "no recomendada" sin importar el puntaje.

### Infraestructura
- **Next.js 16 + TypeScript strict + Tailwind 4**, una sola app para frontend y API.
- **Open-Meteo sin API key** con caché de 30 min en servidor y validación Zod de la respuesta externa; errores de tercero devuelven 503 con mensaje reintentable, nunca pantalla blanca.
- API `GET /api/forecast?lat&lng&productType` → 72 horas evaluadas + ventanas.
- Persistencia en `localStorage` (demo sin costes ni registro); la interfaz del almacén (`src/lib/almacen.ts`) imita las consultas futuras de Supabase, así el swap toca un solo archivo.

---

## Limitaciones actuales (deliberadas, por ser demo)

- **Sin backend de datos**: los lotes viven en el navegador de cada dispositivo. No hay cuentas ni sincronización.
- **Umbrales sin validación profesional**: los valores son de guías públicas; deben revisarse con un ingeniero agrónomo matriculado antes de presentarse como recomendación (están centralizados justamente para que ajustarlos sea una sola edición).
- **Catálogo de productos curado, no exhaustivo**: la fuente oficial completa es el Registro Nacional de Terapéutica Vegetal de SENASA (miles de productos registrados); el catálogo embebido cubre los de uso más extendido y el registro acepta texto libre para el resto.
- **NDVI/NDRE requieren credenciales de Sentinel Hub** (`SENTINELHUB_CLIENT_ID` / `SENTINELHUB_CLIENT_SECRET`, plan gratuito de Copernicus Data Space). Sin ellas la pantalla usa datos de demostración y lo dice explícitamente; ese modo no debe presentarse como medición ante un tercero. Las observaciones reales dependen de la frecuencia de pasada (~5 días) y de la nubosidad.
- **Uso no comercial de Open-Meteo**: el plan gratuito es para uso no comercial; al monetizar hay que pasar al plan comercial o self-hostear.
- La app **informa condiciones meteorológicas y no reemplaza la receta fitosanitaria** de un profesional matriculado (aviso legal siempre visible).

---

## Próximos pasos

### Corto plazo (cerrar el MVP como producto)
1. **Deploy a Vercel** — el build ya pasa; es importar el repo.
2. **Supabase + magic link + RLS** — el SQL del esquema ya está escrito (blueprint, sección 5); reemplaza `almacen.ts` y da cuentas, multi-dispositivo y autorización en la base.
3. **Validación agronómica de umbrales** con un ingeniero agrónomo; ajustar `THRESHOLDS` según su criterio.
4. **PWA instalable** con caché del último pronóstico: en el campo la señal es intermitente.

### Mediano plazo (retención)
5. **Integración con el registro de SENASA**: reemplazar el catálogo curado por el Registro Nacional de Terapéutica Vegetal completo (número de registro, empresa, cultivos autorizados, clase toxicológica), idealmente con actualización periódica.
6. **Notificaciones push** cuando se abre una ventana de aplicación en un lote ("mañana 6:00–10:00, óptima").
7. **Exportación PDF del historial** por lote y campaña: el registro congelado se convierte en documento de cumplimiento presentable.
8. **Equipos y usuarios múltiples**: el productor, el aplicador y el agrónomo ven los mismos lotes con roles distintos.
9. **Estación meteorológica del productor** como fuente alternativa: la separación entre `openmeteo.ts` (proveedor) y `spray-engine.ts` (decisión) ya lo permite sin tocar la lógica.

### Largo plazo (el activo de datos)
10. **Profundizar la capa satelital**: validar el parser contra una cuenta real de Copernicus (el esquema de la Statistical API está aislado en `parsearRespuestaEstadisticas`), sumar un preview visual Sentinel-2 real del lote (hoy la miniatura es Esri), mover el cache a Redis/Supabase, y una vista agregada de vigor entre lotes (como la de Ventanas). Más adelante, cruzar vigor con la meteorología para priorizar qué lote aplicar primero.
11. **Historial agronómico acumulado**: `applications.conditions` acumula, campaña tras campaña, qué se aplicó, cuándo y bajo qué condiciones — el dataset que hoy no existe y que la predicción de rendimiento y la trazabilidad van a necesitar.
12. **Modelo de pulverización selectiva / prescripciones**: con lotes, condiciones e historial, el paso natural es recomendar no solo *cuándo* sino *cómo* (gota, pastilla, volumen).

---

*Datos meteorológicos de [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Imágenes satelitales de Esri, Maxar, Earthstar Geographics.*
