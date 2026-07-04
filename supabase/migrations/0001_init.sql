-- =============================================================================
-- Bookmist — Migración 0001: esquema inicial
-- Tablas: productos (cajas/kits), items_catalogo (biblioteca reusable de
-- libros/accesorios), producto_items (contenido curado de cada caja/kit)
-- =============================================================================

-- Extensiones ----------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Tipos enumerados (conjuntos cerrados, a diferencia de `categoria` que queda
-- texto libre porque los géneros literarios son un conjunto abierto/creciente,
-- igual que en Martín Libros) --------------------------------------------------
create type producto_tipo as enum ('caja', 'kit');
create type item_tipo     as enum ('libro', 'accesorio');

-- Tabla: productos (cajas y kits vendibles, ya armados por Daniela) ----------
create table productos (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  nombre            text not null,
  tipo              producto_tipo not null,
  categoria         text,          -- género/temática: terror, manga, thriller...
  descripcion       text,
  precio            numeric(10,2) not null default 0,
  stock             integer       not null default 0,
  imagen_principal  text,
  destacado         boolean       not null default false,
  activo            boolean       not null default true,
  orden             integer       not null default 0,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  constraint productos_precio_no_negativo check (precio >= 0),
  constraint productos_stock_no_negativo  check (stock >= 0),
  constraint productos_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index productos_categoria_idx  on productos (categoria);
create index productos_activo_idx     on productos (activo);
create index productos_destacado_idx  on productos (destacado) where destacado;

-- Tabla: items_catalogo (biblioteca reusable: "cosas que van dentro de una
-- caja/kit" — libros o accesorios — para no recargar los mismos datos en cada
-- producto). `precio`/`stock` quedan nullable y sin uso en esta fase: son la
-- semilla para una futura venta de libros sueltos en pre-venta (Fase 7), así
-- se evita un ALTER TABLE + backfill más adelante. ---------------------------
create table items_catalogo (
  id          uuid primary key default gen_random_uuid(),
  tipo        item_tipo not null,
  nombre      text not null unique,
  autor       text,          -- solo aplica a tipo 'libro'
  descripcion text,
  imagen      text,
  precio      numeric(10,2), -- nullable: sin uso hasta la Fase 7
  stock       integer,       -- nullable: sin uso hasta la Fase 7
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint items_catalogo_precio_no_negativo check (precio is null or precio >= 0),
  constraint items_catalogo_stock_no_negativo  check (stock is null or stock >= 0)
);

create index items_catalogo_tipo_idx on items_catalogo (tipo);

-- Tabla: producto_items ("qué incluye" cada caja/kit) -------------------------
-- on delete restrict en item_id: borrar un ítem de la biblioteca que sigue
-- dentro de un producto activo debe fallar, no corromper el contenido de esa
-- caja en silencio.
create table producto_items (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references productos(id)      on delete cascade,
  item_id      uuid not null references items_catalogo(id) on delete restrict,
  cantidad     integer not null default 1,
  orden        integer not null default 0,
  constraint producto_items_cantidad_positiva check (cantidad > 0),
  constraint producto_items_unico unique (producto_id, item_id)
);

create index producto_items_producto_id_idx on producto_items (producto_id);
create index producto_items_item_id_idx     on producto_items (item_id);

-- Nota de escala: se deliberadamente NO se agregan índices trigram/de full-text
-- search (como los de Martín Libros en catálogos de ~450k filas) — el catálogo
-- de Bookmist va a ser de decenas/cientos de SKUs por mucho tiempo. Reconsiderar
-- si `productos` supera ~5000 filas.
