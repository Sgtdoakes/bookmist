-- =============================================================================
-- Bookmist — Migración 0037: blog
-- Pedido de Dani: una sección de notas con título, bajada, imagen, cuerpo de
-- texto y links a sus productos.
--
-- El cuerpo es texto plano con tres marcas mínimas que arma el panel con
-- botones (## subtítulo, **negrita**, [texto](/productos/slug)) — lo
-- interpreta src/lib/blog-cuerpo.ts y React lo dibuja escapado, así que acá
-- no se guarda HTML nunca.
--
-- producto_ids son las tarjetas de "Productos de esta nota" que van al final,
-- en el orden que eligió Dani. Array y no tabla intermedia: es una lista corta
-- que solo se lee entera junto con la nota, igual que los productos elegidos a
-- mano de un bloque "Productos" (pagina_secciones.config.productos). Un
-- producto borrado o pausado simplemente deja de aparecer
-- (getProductosPorIds filtra activo = true).
--
-- publicado_at se fija la primera vez que la nota se publica y no se toca más:
-- es la fecha que se muestra, y despublicar/republicar para corregir un typo
-- no la puede mover al día de hoy.
-- =============================================================================

create table blog_posts (
  id            uuid        primary key default gen_random_uuid(),
  slug          text        not null unique,
  titulo        text        not null,
  bajada        text        not null default '',
  imagen        text,
  cuerpo        text        not null default '',
  producto_ids  uuid[]      not null default '{}',
  publicado     boolean     not null default false,
  publicado_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Mismo formato que productos.slug (0001).
  constraint blog_posts_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint blog_posts_titulo_no_vacio check (length(trim(titulo)) > 0)
);

create index blog_posts_publicados_idx on blog_posts (publicado, publicado_at desc);

create trigger blog_posts_set_updated_at
  before update on blog_posts
  for each row
  execute function set_updated_at();

alter table blog_posts enable row level security;

-- Las lecturas públicas pasan por src/lib/supabase/public.ts (service role) y
-- filtran publicado = true a mano, igual que el catálogo; esta policy es la
-- red por si algo alguna vez lee con la anon key.
create policy "blog_posts_select_publico"
  on blog_posts for select
  to anon
  using (publicado = true);

create policy "blog_posts_admin_total"
  on blog_posts for all
  to authenticated
  using (true)
  with check (true);
