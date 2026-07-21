-- =============================================================================
-- Bookmist — Migración 0026: cupón de bienvenida por suscripción (Fase 8e)
--
-- suscriptores_newsletter: quien completa el popup "Suscribite y recibí un
-- cupón" en el sitio público. RLS sin ninguna policy para "anon": los
-- inserts pasan por /api/newsletter con el cliente de service role (mismo
-- patrón que /api/checkout), así que el rol anónimo no necesita — ni puede—
-- leer ni escribir esta tabla directo vía la API de Supabase. Son datos
-- personales, no un catálogo público.
--
-- orders.cupon_codigo: qué código usó el cliente (si usó uno), para que
-- Dani lo vea en el pedido. El monto del descuento del cupón se suma al ya
-- existente orders.descuento (por transferencia) — no hace falta una
-- columna aparte para el monto, alcanza con saber qué código se aplicó.
-- =============================================================================

create table suscriptores_newsletter (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  nombre     text not null,
  cumpleanos text,
  provincia  text,
  created_at timestamptz not null default now()
);

alter table suscriptores_newsletter enable row level security;

create policy "suscriptores_admin_total"
  on suscriptores_newsletter for all
  to authenticated
  using (true)
  with check (true);

alter table orders
  add column cupon_codigo text;
