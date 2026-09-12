# Ventana de Aplicación — funciones, problemas que resuelve y próximos pasos

**Propósito fijo, en una frase:** decidir si se puede pulverizar un lote, ahora, en las próximas 72 h. Gratis, ilimitado. Todo lo demás — avisos automáticos, vigor satelital, score de riesgo — es Premium: lo que automatiza el uso diario o lo que vale más que la decisión de hoy.

**El modelo de negocio, en una línea:** freemium clásico sobre una herramienta de uso diario real, no un producto financiero disfrazado. El productor entra porque necesita saber si puede aplicar hoy — eso nunca se paga. Paga por dejar de tener que entrar a mirar (avisos), por ver algo que hoy no ve (vigor satelital, con costo real de proveedor detrás), y por un reporte que vale más afuera de la app que adentro (score de manejo, insumo para seguro o crédito agro). Detalle completo del modelo en el [README](README.md#modelo-freemium).

---

## Problemas que soluciona

| Problema real | Cómo lo ataca la app |
|---|---|
| **La decisión de aplicar se toma a ojo.** El productor mira el viento y decide, pero la calidad de una aplicación depende de al menos seis variables que interactúan (viento, ráfagas, Delta-T, temperatura, humedad, lluvia próxima). | Un motor de decisión evalúa cada hora con umbrales explícitos y devuelve un veredicto único con su razón limitante: "Condiciones no favorables — Viento de 24 km/h". |
| **La deriva daña lotes vecinos y genera conflictos y sanciones.** El viento excesivo es conocido; el aire *demasiado quieto* (deriva por suspensión) y la inversión térmica nocturna casi nunca se consideran. | El motor bloquea tanto por viento excesivo como insuficiente, y detecta condiciones compatibles con inversión térmica (noche + calma + cielo despejado) con criterio conservador. |
| **Se pierde producto y plata por evaporación y lavado.** Aplicar con Delta-T alto evapora la gota antes de llegar al objetivo; una lluvia a las pocas horas lava un producto de contacto. Cada tanque desperdiciado son cientos de dólares. | Delta-T calculado hora por hora (aproximación de Stull) y ventana libre de lluvia según el tipo de producto: un sistémico necesita 1 h sin lluvia, un contacto 4 h. La misma hora puede ser verde para uno y roja para el otro. |
| **"¿Y si espero?" no tiene respuesta fácil.** Saber que ahora no se puede es la mitad del problema; la otra mitad es saber cuándo sí. | Línea de tiempo de 72 h coloreada hora por hora y ventanas recomendadas (bloques de 2+ h aplicables) ordenadas por calidad, solo hacia adelante. |
| **El registro de aplicaciones es papel, memoria o nada.** Ante un reclamo, una inspección o una auditoría de buenas prácticas, no hay evidencia de las condiciones al momento de aplicar. | Cada aplicación registrada congela el estado meteorológico completo del momento (snapshot inmutable): aunque después cambien los umbrales del motor, el registro histórico no se altera. Es un registro de cumplimiento, no un cálculo recalculable. |
| **Las herramientas agro suelen ser dashboards de escritorio.** El que decide está arriba de la camioneta, no en la oficina. | Móvil primero: una columna, tipografía grande, toques de 44 px, color nunca como único código (marcas de forma para daltonismo), estados de carga y error en toda pantalla. |
| **El seguro y el crédito agro se tarifican casi a ciegas.** Sin datos verificables de manejo, la aseguradora o el banco cobran la misma prima/tasa al productor prolijo y al que aplica a ciegas — no hay incentivo económico a las buenas prácticas. | Cada aplicación registrada ya queda congelada con sus condiciones reales; el score de manejo (`src/lib/riesgo.ts`) sintetiza ese historial más la estabilidad del vigor NDVI en un índice pensado como insumo para underwriting paramétrico. |
| **"¿Cuánto vale realmente esta decisión?" no tiene respuesta en la unidad que le importa al productor.** Un Delta-T de 11 no dice nada sobre plata. | El veredicto se traduce a pesos: cuánto representa aplicar ahora contra esperar la mejor ventana, sobre las hectáreas reales del lote. |
| **Leer un diagnóstico completo lleva tiempo, y las dudas de seguimiento ("¿y si espero a mañana?") no tienen dónde hacerse.** | Un asistente conversacional por lote (Groq) responde en lenguaje natural sobre el mismo diagnóstico ya calculado, con foco en acciones concretas a evaluar — nunca inventa un dato que ese diagnóstico no tenga. |

---

## El principio: dato → interpretación → conclusión → acción a evaluar → evidencia

La app dejó de ser un tablero de indicadores. Conocer un NDVI de 0,68, un agotamiento de 0,64 y una mínima de 1,8 °C no le dice a un productor qué hacer; el trabajo de interpretarlos lo hacía él, cada vez.

La capa de síntesis ([sintesis.ts](src/lib/sintesis.ts)) hace ese trabajo y expone el resultado en dos niveles: la **conclusión primero**, para resolver en diez segundos, y la **evidencia a un toque**, para que el agrónomo revise en qué se apoya. Dos reglas que el módulo cumple sin excepción:

- Ningún indicador importante se muestra sin explicar qué significa.
- Ninguna conclusión se emite sin mostrar los datos que la sustentan — y si esos datos no alcanzan, se dice, con el motivo.

No reemplaza al profesional: reduce el tiempo de interpretar información y detectar lo que merece atención. Por eso el lenguaje separa información, interpretación y acción a evaluar, y nunca instruye.

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

### Valor económico y score de manejo (`src/lib/riesgo.ts` — el puente a fintech)
- **Valor económico de la decisión**, integrado en la pantalla de veredicto: compara el score de la hora actual con el de la mejor ventana de las próximas 72 h y lo traduce a pesos sobre las hectáreas reales del lote ("~$1.491.660 en juego" cuando aplicar ahora arriesga la inversión completa; "sin pérdida de eficiencia estimada" cuando el momento actual ya es el mejor disponible).
- **Score de manejo** (`/lotes/[id]/riesgo`), 0-100 con banda (alto/medio/bajo) y desglose de factores: qué fracción de las aplicaciones registradas se hizo en condiciones aceptables u óptimas (dato congelado, nunca recalculado con umbrales de hoy) + estabilidad del NDVI real entre observaciones sin nubes. Presentado explícitamente como el tipo de dato que un seguro paramétrico o una línea de crédito agro usaría para tarificar riesgo.
- **Metodología marcada como ilustrativa en la propia pantalla** ("no un modelo actuarial validado"): mismo estándar de honestidad que ya se aplica a NDVI/NDRE y a los umbrales del motor. El costo por hectárea (`COSTO_PROMEDIO_HA_ARS`) y los pesos del score están centralizados para ajustarse en un solo lugar.
- **No decide nada**: ni el valor económico ni el score tocan `spray-engine.ts`; son una relectura de datos que la app ya genera, no un tercer motor de decisión.

### Asistente conversacional del lote (`src/lib/chat/` — Groq)
- **Botón flotante en la pantalla de decisión**, con el contexto de ESE lote ya cargado: el mismo `Diagnostico` de `sintesis.ts` que el productor ya ve en pantalla, más el valor económico y las últimas aplicaciones registradas. Nunca vuelve a consultar clima, satélite ni balance hídrico por su cuenta.
- **Foco en acciones sugeridas, no en explicar de más**: la respuesta llega estructurada (`{"respuesta", "acciones"}`) y la UI destaca las acciones aparte, en una lista corta e imperativa.
- **Multi-turno en memoria de la sesión** (se pierde al recargar) y **5 consultas gratis por día** por dispositivo antes de pedir Premium — mismo modelo de confianza sin backend que el resto del Paywall de demo.
- **Mismo límite legal que toda la app**: describe y sugiere qué evaluar, nunca instruye una receta fitosanitaria — reglas explícitas en el propio prompt del sistema (`src/lib/chat/groq.ts`).
- **No decide nada ni recalcula agronomía**: es una capa conversacional sobre datos que la app ya produce, mismo criterio que el valor económico y el score de manejo de arriba.

### Lotes
- Alta de lote **dibujando el polígono sobre imagen satelital** (Leaflet + Geoman, en español, herramienta activa por defecto).
- Cálculo automático de **centroide y hectáreas** (Turf); validación de polígono: mínimo 4 vértices, entre 0,5 y 5.000 ha, sin auto-intersección, y sin superponerse más de un 10% con un lote ya cargado (medido en ambas direcciones, para que un polígono grande tampoco se trague a uno chico existente).
- Listado de lotes con **punto de estado actual** por lote (verde / ámbar / rojo con etiqueta en palabras).
- Botón de **3 lotes de ejemplo** (Marcos Juárez, Río Cuarto, Villa María) para demo instantánea con pronóstico real.

### Decisión
- **Veredicto grande** con el estado actual y la razón limitante en una línea ("Condiciones favorables" / "Al límite" / "Condiciones no favorables"). El lenguaje describe condiciones y nunca instruye: la decisión de aplicar es del profesional matriculado (Ley provincial 9164), y el titular no puede contradecir el aviso legal del pie.
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
- **El score de manejo es un prototipo, no un modelo de riesgo validado**: los pesos de cada factor son un punto de partida razonable, no una calibración con datos de siniestros. Presentarlo ante una aseguradora o un banco como algo más que un prototipo sería sobre-prometer; la pantalla lo dice explícitamente.
- **El costo por hectárea es un supuesto único** (`COSTO_PROMEDIO_HA_ARS`), no el precio real del producto elegido. El próximo paso obvio es tomarlo del producto de `productos.ts` o de un campo que cargue el productor.

---

## Próximos pasos

### Por qué algunos módulos no entran todavía (aunque estén especificados)

Hay un spec más amplio de 13 módulos agronómicos (monitoreo satelital avanzado, riego, notificaciones con backend real, bitácora de campo, importación/exportación, predicción de rendimiento, detección de plagas) del que sólo una parte entra hoy. No es falta de tiempo únicamente — varios necesitan infraestructura que este proyecto no tiene por diseño (ver [Decisiones de la demo](README.md#decisiones-de-la-demo)):

- **Notificaciones con backend real** (tablas de reglas/alertas, un email agrupado por establecimiento, dedup server-side): necesita base de datos, cron y un proveedor de email. Lo que existe hoy (`notificaciones.ts`, Notification API del navegador) es el máximo defendible sin ese backend — está documentado como prototipo, no como el sistema final.
- **Importación/exportación de lotes** (CSV/KML con mapeo de columnas, preview, undo): es una pieza de UI e integración considerable por sí sola (parsers nuevos, transacciones, deshacer) — no es una extensión de una función existente.
- **Predicción de rendimiento**: necesita 2-3 campañas cerradas con rinde real por lote, que hoy no existen (ni siquiera el registro de campañas existe todavía). Construirla ahora significaría inventar un número sin datos reales detrás — exactamente lo que este proyecto evita en el motor de pulverización, en el satelital y en el score de manejo.
- **Detección de plagas**: el paso previo que la haría viable (foto estructurada + revisión remota de un agrónomo) necesita un segundo rol de usuario que la app no tiene — no hay autenticación ni usuarios múltiples, todo vive en `localStorage` de un solo dispositivo.

### Corto plazo (cerrar el MVP como producto)
1. **Deploy a Vercel** — el build ya pasa; es importar el repo.
2. **Supabase + magic link + RLS** — el esquema SQL ya está escrito (`supabase/migrations/`, ver [Base de datos](README.md#base-de-datos-supabase) en el README); falta crear el proyecto Supabase real, aplicarlo y reemplazar `almacen.ts` (además de `plan.ts` y `chat/limite.ts`) para que hablen con él. Da cuentas, multi-dispositivo y autorización en la base.
3. **Validación agronómica de umbrales** con un ingeniero agrónomo; ajustar `THRESHOLDS` según su criterio.
4. **PWA instalable** con caché del último pronóstico: en el campo la señal es intermitente.

### Mediano plazo (retención + fintech)
5. **Costo real por producto**: tomar el precio por hectárea del principio activo/marca elegido en `productos.ts` (o un campo que cargue el productor) en vez del supuesto único `COSTO_PROMEDIO_HA_ARS`. Convierte el valor económico de estimación gruesa a cifra creíble.
6. **Validar el score de manejo con una aseguradora o fintech agro real**: llevarlo como prototipo a una conversación de descubrimiento con una InsurTech paramétrica (categoría activa: Skybound, Descartes Underwriting, ClimateAi) o un banco agro, para saber qué factores pesarían realmente y qué se necesitaría para que un score así entre a un modelo de tarificación.
7. **Integración con el registro de SENASA**: reemplazar el catálogo curado por el Registro Nacional de Terapéutica Vegetal completo (número de registro, empresa, cultivos autorizados, clase toxicológica), idealmente con actualización periódica.
8. **Notificaciones push** cuando se abre una ventana de aplicación en un lote ("mañana 6:00–10:00, óptima").
9. **Exportación PDF del historial + score** por lote y campaña: el registro congelado y el score de manejo se convierten en un documento presentable ante un asegurador o un banco.
10. **Equipos y usuarios múltiples**: el productor, el aplicador y el agrónomo ven los mismos lotes con roles distintos.
11. **Estación meteorológica del productor** como fuente alternativa: la separación entre `openmeteo.ts` (proveedor) y `spray-engine.ts` (decisión) ya lo permite sin tocar la lógica.

### Largo plazo (el activo de datos)
12. **Producto B2B2B**: el score de manejo agregado por cartera de lotes (no por productor individual) como API que una aseguradora o un banco agro consulta para suscribir — el modelo de negocio real detrás de "app gratis para el productor, ingreso por licenciar el dato de manejo a quien tarifica riesgo".
13. **Profundizar la capa satelital**: validar el parser contra una cuenta real de Copernicus (el esquema de la Statistical API está aislado en `parsearRespuestaEstadisticas`), sumar un preview visual Sentinel-2 real del lote (hoy la miniatura es Esri), mover el cache a Redis/Supabase, y una vista agregada de vigor entre lotes (como la de Ventanas).
14. **Historial agronómico acumulado**: `applications.conditions` acumula, campaña tras campaña, qué se aplicó, cuándo y bajo qué condiciones — el dataset que hoy no existe y que la predicción de rendimiento, la trazabilidad y el score de manejo van a necesitar en volumen.
15. **Modelo de pulverización selectiva / prescripciones**: con lotes, condiciones e historial, el paso natural es recomendar no solo *cuándo* sino *cómo* (gota, pastilla, volumen).

---

*Datos meteorológicos de [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Imágenes satelitales de Esri, Maxar, Earthstar Geographics.*
