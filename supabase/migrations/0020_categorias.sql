-- =============================================================================
-- Bookmist — Migración 0020: categorías reales (Fase 6i, paso 1 de 2)
-- Pedido de Dani: reemplazar el campo de texto libre "categoría" por
-- categorías de verdad — un producto puede tener varias, se pueden crear
-- nuevas desde el panel, y /productos navega por ellas. "Destacados" pasa a
-- ser una categoría más (hoy es un boolean aparte).
--
-- Additiva a propósito: NO borra productos.categoria ni productos.destacado
-- todavía — el código deployado los sigue leyendo hasta el próximo deploy.
-- El paso 2 (migración 0021, post-deploy) los elimina.
-- =============================================================================

-- Para generar slugs desde nombres con tildes (Marcapáginas -> marcapaginas)
create extension if not exists unaccent;

create table categorias (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  nombre     text not null unique,
  orden      integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categorias_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create trigger categorias_set_updated_at
  before update on categorias
  for each row
  execute function set_updated_at();

create table producto_categorias (
  producto_id  uuid not null references productos(id)  on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  primary key (producto_id, categoria_id)
);

create index producto_categorias_categoria_id_idx on producto_categorias (categoria_id);

-- RLS: lectura pública, escritura solo autenticados (mismo patrón que
-- productos/zonas_envio) --------------------------------------------------------
alter table categorias enable row level security;
alter table producto_categorias enable row level security;

create policy "categorias_select_publico"
  on categorias for select
  to anon, authenticated
  using (true);

create policy "categorias_admin_total"
  on categorias for all
  to authenticated
  using (true) with check (true);

create policy "producto_categorias_select_publico"
  on producto_categorias for select
  to anon, authenticated
  using (true);

create policy "producto_categorias_admin_total"
  on producto_categorias for all
  to authenticated
  using (true) with check (true);

-- Seed: las 4 categorías que pidió Dani, en su orden -------------------------
insert into categorias (nombre, slug, orden) values
  ('Kits y cajas literarias', 'kits-y-cajas-literarias', 0),
  ('Accesorios',              'accesorios',              1),
  ('Marcapáginas',            'marcapaginas',            2),
  ('Destacados',              'destacados',              3);

-- Backfill 1: cada valor distinto del texto libre existente que no sea una
-- de las 4 de arriba se convierte en categoría propia (ej. "Libros"), para
-- no perder ninguna clasificación ya hecha.
insert into categorias (nombre, slug, orden)
select distinct
  p.categoria,
  regexp_replace(
    regexp_replace(lower(unaccent(p.categoria)), '[^a-z0-9]+', '-', 'g'),
    '(^-|-$)', '', 'g'
  ),
  99
from productos p
where p.categoria is not null
  and p.categoria not in (select nombre from categorias);

-- Backfill 2: vínculos producto→categoría desde el texto libre
insert into producto_categorias (producto_id, categoria_id)
select p.id, c.id
from productos p
join categorias c on c.nombre = p.categoria
where p.categoria is not null;

-- Backfill 3: los "Box literario ..." son las cajas reales → "Kits y cajas
-- literarias". NO se usa el tipo caja/kit para esto: hoy TODOS los productos
-- tienen ese tipo (era la única opción del form), incluidos los marcapáginas.
insert into producto_categorias (producto_id, categoria_id)
select p.id, c.id
from productos p
join categorias c on c.slug = 'kits-y-cajas-literarias'
where p.nombre ilike 'box literario%'
on conflict do nothing;

-- Backfill 4: destacado=true → categoría "Destacados"
insert into producto_categorias (producto_id, categoria_id)
select p.id, c.id
from productos p
join categorias c on c.slug = 'destacados'
where p.destacado
on conflict do nothing;
