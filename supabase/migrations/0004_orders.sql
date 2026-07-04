-- =============================================================================
-- Bookmist — Migración 0004: pedidos (orders)
-- Fase 2: checkout con pago manual (transferencia/efectivo). Mercado Pago se
-- suma en la Fase 3; envío por Andreani se automatiza en la Fase 4 (por ahora
-- `costo_envio` queda nullable = "a coordinar").
-- =============================================================================

create type metodo_pago   as enum ('transferencia', 'efectivo');
create type estado_pedido as enum ('pendiente', 'pagado', 'cancelado');

-- numero_pedido legible tipo BM-0001, generado por secuencia.
create sequence orders_numero_seq;

create table orders (
  id               uuid primary key default gen_random_uuid(),
  numero_pedido    text not null unique
                     default ('BM-' || lpad(nextval('orders_numero_seq')::text, 4, '0')),
  cliente_nombre   text not null,
  cliente_email    text not null,
  cliente_telefono text not null,
  -- Bookmist envía a todo el país (sin retiro en persona): la dirección
  -- siempre es obligatoria. El costo se resuelve por zona recién en la Fase 4;
  -- hasta entonces null = "a coordinar".
  direccion_envio  text not null,
  costo_envio      numeric(10,2),
  metodo_pago      metodo_pago   not null,
  estado           estado_pedido not null default 'pendiente',
  total            numeric(10,2) not null default 0,
  notas            text,
  leido            boolean       not null default false, -- pedidos nuevos sin leer
  created_at       timestamptz   not null default now(),
  constraint orders_total_no_negativo       check (total >= 0),
  constraint orders_costo_envio_no_negativo check (costo_envio is null or costo_envio >= 0)
);

create index orders_estado_idx     on orders (estado);
create index orders_created_at_idx on orders (created_at desc);
create index orders_no_leidos_idx  on orders (leido) where not leido;

-- Items con snapshot de nombre y precio (no cambian si el producto se edita
-- después). on delete set null en producto_id: si se borra el producto, el
-- pedido histórico conserva el detalle igual.
create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  producto_id     uuid references productos(id) on delete set null,
  nombre          text not null,
  precio_unitario numeric(10,2) not null,
  cantidad        integer not null,
  constraint order_items_cantidad_positiva  check (cantidad > 0),
  constraint order_items_precio_no_negativo check (precio_unitario >= 0)
);

create index order_items_order_id_idx    on order_items (order_id);
create index order_items_producto_id_idx on order_items (producto_id);
