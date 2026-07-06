-- =============================================================================
-- Bookmist — Migración 0010: secciones editables de las páginas (Fase 5b)
-- Permite reordenar/ocultar/editar el contenido de las secciones de la home
-- (y, a futuro, de otras páginas) desde el panel — mismo patrón que
-- `home_sections` en Martín Libros, con una columna `pagina` desde el
-- arranque para no tener que migrar el esquema cuando se sume otra página.
-- Si la tabla está vacía (o Supabase no está configurado), la home usa el
-- layout por defecto hardcodeado — nunca se rompe (ver src/lib/secciones.ts).
-- =============================================================================

create table pagina_secciones (
  id         uuid primary key default gen_random_uuid(),
  pagina     text        not null default 'home',
  tipo       text        not null,
  orden      integer     not null default 0,
  activo     boolean     not null default true,
  config     jsonb       not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Por ahora cada tipo de sección aparece una sola vez por página (set fijo
  -- de bloques predefinidos, no un lienzo libre como en Martín Libros).
  constraint pagina_secciones_pagina_tipo_unico unique (pagina, tipo)
);

create index pagina_secciones_pagina_idx on pagina_secciones (pagina, orden);

create trigger pagina_secciones_set_updated_at
  before update on pagina_secciones
  for each row
  execute function set_updated_at();

alter table pagina_secciones enable row level security;

create policy "pagina_secciones_select_publico"
  on pagina_secciones for select
  to anon
  using (activo = true);

create policy "pagina_secciones_admin_total"
  on pagina_secciones for all
  to authenticated
  using (true)
  with check (true);
