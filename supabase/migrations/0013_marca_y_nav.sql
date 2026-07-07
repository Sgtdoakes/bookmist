-- =============================================================================
-- Bookmist — Migración 0013: navegación editable (Fase 6f-1)
-- Tabla de links de navegación (hoy hardcodeados en NAV_LINKS,
-- src/lib/constants.ts) para poder agregar/reordenar/ocultar desde el
-- admin. Header y footer pasan a leer de acá. La configuración de marca
-- (nombre, redes, colores, etc.) no necesita tabla nueva: usa la tabla
-- `configuracion` que ya existe (migración 0009), con claves `marca_*`.
-- =============================================================================

create table nav_links (
  id         uuid primary key default gen_random_uuid(),
  label      text        not null,
  href       text        not null,
  orden      integer     not null default 0,
  activo     boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nav_links_activo_idx on nav_links (activo, orden);

create trigger nav_links_set_updated_at
  before update on nav_links
  for each row
  execute function set_updated_at();

alter table nav_links enable row level security;

create policy "nav_links_select_publico"
  on nav_links for select
  to anon
  using (activo = true);

create policy "nav_links_admin_total"
  on nav_links for all
  to authenticated
  using (true)
  with check (true);

-- Semilla: los 5 links actuales de NAV_LINKS. Las 3 institucionales siguen
-- apuntando a "#" hasta que la Fase 6f-2 les dé una página real.
insert into nav_links (label, href, orden) values
  ('Inicio', '/', 0),
  ('Productos', '/productos', 1),
  ('Contacto', '#', 2),
  ('Preguntas frecuentes', '#', 3),
  ('Política de devolución', '#', 4);
