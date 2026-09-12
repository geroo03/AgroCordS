-- Esquema inicial de "Ventana de Aplicación" para Supabase/Postgres.
--
-- Reemplaza a `localStorage` (ver src/lib/almacen.ts, plan.ts, chat/limite.ts,
-- notificaciones.ts): hoy un dispositivo = un almacén, sin cuentas. Acá se le
-- agrega `user_id` a todo lo que la app ya guarda, apoyado en Supabase Auth
-- (magic link, sin contraseña — ver PRODUCTO.md, "Supabase + magic link + RLS").
--
-- Alcance: sólo esquema (tablas + RLS). No hay ningún proyecto Supabase real
-- corriendo esto todavía — lo aplica quien tenga el proyecto, con
-- `supabase link && supabase db push`, o pegando este archivo entero en el
-- SQL Editor de supabase.com/dashboard. El código de la app (almacen.ts,
-- plan.ts, chat/limite.ts) sigue en localStorage por ahora: conectarlo a estas
-- tablas es un paso aparte, futuro, contra un proyecto real.
--
-- Convenciones de tiempo, tal como las usa el resto de la app (ver README,
-- sección "Zonas horarias"): las horas de pronóstico (`HourAssessment.time` /
-- `HourlyConditions.time`) son cadenas ISO LOCALES DEL LOTE, nunca convertidas
-- a `Date` — dentro del JSONB de `condiciones` esos campos quedan como texto
-- tal cual, nunca como `timestamptz`. `fecha_siembra` es una fecha civil
-- (`date`, sin hora). `creado_en`/`aplicada_en` sí son instantes reales
-- (`timestamptz`), porque se generan con `new Date().toISOString()`.

create extension if not exists pgcrypto;

-- ── Lotes ──────────────────────────────────────────────────────────────────
-- Espejo de `Lote` (src/lib/tipos.ts). El polígono se guarda como GeoJSON en
-- JSONB, igual a como lo produce Turf/Leaflet hoy — no se usa PostGIS porque
-- ningún query de la app necesita operaciones espaciales todavía; si algún
-- día hicieran falta (ej. "lotes cerca de tal punto"), la migración natural
-- es una columna `geometry(Polygon, 4326)` con la extensión `postgis`.

create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  cultivo text,
  fecha_siembra date,
  geometry jsonb not null,
  centroid_lat double precision not null,
  centroid_lng double precision not null,
  area_ha numeric not null,
  creado_en timestamptz not null default now()
);

comment on table public.lotes is 'Un lote productivo con su polígono. Espejo de Lote en src/lib/tipos.ts.';
comment on column public.lotes.fecha_siembra is 'Fecha civil (YYYY-MM-DD), sin hora ni huso horario — nunca timestamptz.';
comment on column public.lotes.geometry is 'GeoJSON Polygon tal cual lo genera Leaflet + Geoman en el cliente.';
comment on column public.lotes.area_ha is 'Hectáreas, calculadas con Turf a partir de geometry.';

create index if not exists lotes_user_id_idx on public.lotes (user_id);

alter table public.lotes enable row level security;

create policy "lotes: el dueño ve las suyas" on public.lotes
  for select using (auth.uid() = user_id);
create policy "lotes: el dueño crea las suyas" on public.lotes
  for insert with check (auth.uid() = user_id);
create policy "lotes: el dueño actualiza las suyas" on public.lotes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lotes: el dueño borra las suyas" on public.lotes
  for delete using (auth.uid() = user_id);

-- ── Aplicaciones ──────────────────────────────────────────────────────────
-- Espejo de `Aplicacion` (src/lib/tipos.ts). `condiciones` congela el
-- `HourAssessment` completo del momento (src/lib/spray-engine.ts:64-73), que
-- a su vez anida `HourlyConditions` y un array de `Reason` — se guarda como
-- JSONB completo en vez de columnizarlo: es un snapshot inmutable de
-- cumplimiento, nunca se recalcula ni se filtra por sus campos internos, así
-- que columnizarlo no aportaría nada y sí complicaría cada cambio futuro del
-- motor de decisión.

create table if not exists public.aplicaciones (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes (id) on delete cascade,
  -- Redundante con lotes.user_id a propósito: permite que las políticas de
  -- RLS de esta tabla filtren directo por user_id, sin tener que hacer un
  -- join contra lotes en cada policy — patrón estándar recomendado por
  -- Supabase para mantener las políticas simples y rápidas.
  user_id uuid not null references auth.users (id) on delete cascade,
  producto_nombre text not null,
  tipo_producto text not null check (tipo_producto in ('sistemico', 'contacto')),
  aplicada_en timestamptz not null default now(),
  condiciones jsonb not null,
  notas text
);

comment on table public.aplicaciones is 'Registro de aplicación con snapshot inmutable de condiciones. Espejo de Aplicacion en src/lib/tipos.ts.';
comment on column public.aplicaciones.condiciones is 'HourAssessment completo congelado (spray-engine.ts). El campo interno "time" es ISO LOCAL DEL LOTE en texto: no se reinterpreta como timestamptz.';
comment on column public.aplicaciones.tipo_producto is 'ProductType en spray-engine.ts: sistemico o contacto (afecta las horas sin lluvia exigidas).';

create index if not exists aplicaciones_lote_id_idx on public.aplicaciones (lote_id);
create index if not exists aplicaciones_user_id_idx on public.aplicaciones (user_id);

alter table public.aplicaciones enable row level security;

create policy "aplicaciones: el dueño ve las suyas" on public.aplicaciones
  for select using (auth.uid() = user_id);
create policy "aplicaciones: el dueño crea las suyas" on public.aplicaciones
  for insert with check (auth.uid() = user_id);
create policy "aplicaciones: el dueño actualiza las suyas" on public.aplicaciones
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "aplicaciones: el dueño borra las suyas" on public.aplicaciones
  for delete using (auth.uid() = user_id);

-- ── Plan del usuario (Premium) ───────────────────────────────────────────
-- Espejo de la bandera "gratis"/"premium" en src/lib/plan.ts. Además guarda
-- lo mínimo del pago onchain que la activó, cuando corresponde: el pago con
-- stablecoin de Twin Finance (src/lib/pagos/) es sólo el MECANISMO para
-- prender esta bandera, no un módulo de facturación aparte — por eso no hay
-- una tabla de pagos separada con monto/bloque/wallets, sólo lo justo para
-- no reactivar Premium dos veces con el mismo comprobante.

create table if not exists public.plan_usuario (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'gratis' check (plan in ('gratis', 'premium')),
  actualizado_en timestamptz not null default now(),
  -- Null cuando Premium se activó con el botón de demo (activarPremium() sin
  -- pago real, ver Paywall.tsx) y no con un pago onchain verificado.
  pago_hash text unique,
  pago_moneda text check (pago_moneda in ('ARGt', 'BRAt')),
  pago_verificado_en timestamptz
);

comment on table public.plan_usuario is 'Plan gratis/premium por usuario. Espejo de plan.ts. pago_* es sólo el respaldo mínimo de qué pago onchain activó Premium, no un historial de facturación.';
comment on column public.plan_usuario.pago_hash is 'Hash de la transacción ERC-20 verificada (0x...). unique evita reactivar Premium dos veces con el mismo comprobante.';

alter table public.plan_usuario enable row level security;

create policy "plan_usuario: el dueño ve su plan" on public.plan_usuario
  for select using (auth.uid() = user_id);
create policy "plan_usuario: el dueño crea su fila" on public.plan_usuario
  for insert with check (auth.uid() = user_id);
-- Mientras sea demo, el propio cliente puede prender su plan (mismo criterio
-- que "Activar Premium (demo)" hoy, sin cobro real detrás). El día que haya
-- cobro real (Mercado Pago/Stripe, o el pago onchain verificado server-side),
-- esta política debería restringirse para que sólo la escriba el servidor
-- con la service role key — dejarlo anotado acá para ese momento, sin
-- bloquear la demo actual con una restricción que todavía no hace falta:
--
--   drop policy "plan_usuario: el dueño actualiza su plan" on public.plan_usuario;
--   -- sin política de UPDATE para el cliente: sólo la service role (que
--   -- ignora RLS) puede escribir plan/pago_* desde ese momento en adelante.
create policy "plan_usuario: el dueño actualiza su plan" on public.plan_usuario
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Uso diario del chat ──────────────────────────────────────────────────
-- Espejo de UsoChatGuardado en src/lib/chat/limite.ts. Pasar esto a DB es una
-- mejora real sobre hoy: el límite de 5 consultas/día deja de ser por
-- dispositivo (localStorage) y pasa a ser por cuenta, entre todos sus
-- dispositivos.

create table if not exists public.uso_chat_diario (
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  consultas integer not null default 0,
  primary key (user_id, fecha)
);

comment on table public.uso_chat_diario is 'Consultas al chatbot por usuario y día. Espejo de limite.ts (LIMITE_GRATIS_DIARIO = 5).';

alter table public.uso_chat_diario enable row level security;

create policy "uso_chat_diario: el dueño ve su uso" on public.uso_chat_diario
  for select using (auth.uid() = user_id);
create policy "uso_chat_diario: el dueño crea su fila" on public.uso_chat_diario
  for insert with check (auth.uid() = user_id);
create policy "uso_chat_diario: el dueño actualiza su uso" on public.uso_chat_diario
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Notificaciones ya enviadas ───────────────────────────────────────────
-- Espejo de la clave ventana.notificadas.v1 en src/lib/notificaciones.ts,
-- que hoy guarda un array de strings "{loteId}·{startTime}" con tope 200
-- para no repetir un aviso de ventana ya mostrado. Acá se separa en columnas
-- en vez de mantener la clave compuesta como texto único.

create table if not exists public.notificaciones_enviadas (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lote_id uuid not null references public.lotes (id) on delete cascade,
  -- Hora de inicio de la ventana (SprayWindow.startTime), ISO LOCAL DEL LOTE
  -- en texto — mismo criterio que HourAssessment.time: nunca timestamptz.
  ventana_inicio text not null,
  enviado_en timestamptz not null default now(),
  unique (lote_id, ventana_inicio)
);

comment on table public.notificaciones_enviadas is 'Deduplicación de avisos de ventana ya mostrados. Espejo de ventana.notificadas.v1 en notificaciones.ts.';
comment on column public.notificaciones_enviadas.ventana_inicio is 'SprayWindow.startTime tal cual: ISO local del lote en texto, nunca timestamptz.';

create index if not exists notificaciones_enviadas_user_id_idx on public.notificaciones_enviadas (user_id);

alter table public.notificaciones_enviadas enable row level security;

create policy "notificaciones_enviadas: el dueño ve las suyas" on public.notificaciones_enviadas
  for select using (auth.uid() = user_id);
create policy "notificaciones_enviadas: el dueño crea las suyas" on public.notificaciones_enviadas
  for insert with check (auth.uid() = user_id);
create policy "notificaciones_enviadas: el dueño borra las suyas" on public.notificaciones_enviadas
  for delete using (auth.uid() = user_id);
