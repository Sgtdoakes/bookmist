-- =============================================================================
-- Bookmist — Migración 0007: zonas de envío (Fase 4a)
-- Costo de envío manual por zona (Daniela las define a mano en el Table
-- Editor de Supabase hasta que exista el panel de administración — Fase 5).
-- La integración real con la API de Andreani queda para la Fase 4b, cuando
-- Bookmist tenga cuenta/contrato comercial con ellos.
-- =============================================================================

create table zonas_envio (
  id         uuid primary key default gen_random_uuid(),
  nombre     text          not null unique,
  costo      numeric(10,2) not null default 0,
  activo     boolean       not null default true,
  orden      integer       not null default 0,
  created_at timestamptz   not null default now(),
  constraint zonas_envio_costo_no_negativo check (costo >= 0)
);

create index zonas_envio_activo_idx on zonas_envio (activo);

-- Nombre de la zona elegida, como snapshot en el pedido (no cambia si la zona
-- se renombra o se borra después) — mismo patrón que producto_items con los
-- productos.
alter table orders add column zona_envio text;
