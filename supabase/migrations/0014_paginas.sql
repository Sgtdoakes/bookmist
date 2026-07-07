-- =============================================================================
-- Bookmist — Migración 0014: páginas institucionales con CRUD completo (Fase 6f-2)
-- Hasta ahora `pagina_secciones.pagina` era un texto libre sin registro de
-- qué páginas existen (el selector del admin era un array hardcodeado en
-- page.tsx: home/productos/producto_detalle). Esta tabla lo hace real: cada
-- fila es una página que puede tener bloques. Las 3 páginas de sistema
-- (rutas fijas del código, no se pueden borrar/renombrar) se siembran acá;
-- las páginas institucionales (Contacto, FAQ, etc.) las crea Dani desde el
-- admin y usan la ruta pública dinámica src/app/(public)/[slug]/page.tsx.
-- =============================================================================

create table paginas (
  id         uuid primary key default gen_random_uuid(),
  slug       text        not null unique,
  titulo     text        not null,
  activo     boolean     not null default true,
  -- Las páginas de sistema tienen ruta propia en el código (/, /productos,
  -- /productos/[slug]) — no se pueden borrar ni renombrar el slug desde el
  -- admin, a diferencia de las institucionales que crea Dani libremente.
  sistema    boolean     not null default false,
  orden      integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index paginas_activo_idx on paginas (activo, orden);

create trigger paginas_set_updated_at
  before update on paginas
  for each row
  execute function set_updated_at();

alter table paginas enable row level security;

create policy "paginas_select_publico"
  on paginas for select
  to anon
  using (activo = true);

create policy "paginas_admin_total"
  on paginas for all
  to authenticated
  using (true)
  with check (true);

-- Semilla: las 3 páginas de sistema ya existentes como valores de
-- pagina_secciones.pagina, para que la FK de abajo no rompa filas actuales.
insert into paginas (slug, titulo, sistema, orden) values
  ('home', 'Home', true, 0),
  ('productos', 'Catálogo', true, 1),
  ('producto_detalle', 'Ficha de producto', true, 2);

-- A partir de acá, toda sección tiene que pertenecer a una página que
-- exista de verdad — y borrar una página institucional se lleva sus
-- bloques con ella (no queda basura huérfana).
alter table pagina_secciones
  add constraint pagina_secciones_pagina_fkey
  foreign key (pagina) references paginas (slug)
  on delete cascade;
