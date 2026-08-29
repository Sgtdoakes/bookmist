-- =============================================================================
-- Bookmist — Migración 0033: seguimiento de pedidos del lado del cliente
--
-- Hasta acá, quien compraba no tenía forma de volver a ver su pedido: la
-- página /pedido/BM-XXXX leía el resumen de sessionStorage, así que al cerrar
-- la pestaña (o abrir el link desde otro dispositivo) se perdían el detalle Y
-- los datos de transferencia — justo el caso de quien elige transferencia
-- para pagar más tarde. Estas tres columnas son la base para que esa página
-- lea de la base y para poder avisar por mail cuando el pedido avanza.
--
-- token_consulta
--   Secreto por pedido que va en el link del mail (/pedido/BM-0042?t=<token>).
--   El número de pedido solo NO alcanza como llave: es correlativo y
--   adivinable (BM-0041, BM-0043...), y estos datos incluyen nombre, teléfono,
--   DNI y dirección. Con el token, saber el número no sirve de nada.
--   32 hex de gen_random_uuid() (ya se usa para los id de esta misma tabla,
--   no hace falta ninguna extensión). Al ser un default volátil, Postgres lo
--   evalúa fila por fila, así que los pedidos que ya existen también reciben
--   uno propio y distinto — por eso el unique no falla.
--
-- seguimiento
--   Número de envío de Andreani, cargado a mano por Dani en el panel. La
--   integración con Andreani es solo de cotización (src/lib/andreani.ts), no
--   genera envíos, así que este dato no puede venir solo.
--
-- estado_actualizado_at
--   Cuándo cambió de estado por última vez, para poder mostrar "Pagado el 3/9"
--   en vez de un estado sin fecha. Los pedidos ya existentes se igualan a su
--   created_at: es la única fecha real que tenemos de ellos, y decir que todos
--   se actualizaron hoy sería mentira.
-- =============================================================================

alter table orders
  add column token_consulta text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  add column seguimiento text,
  add column estado_actualizado_at timestamptz not null default now();

update orders set estado_actualizado_at = created_at;

comment on column orders.token_consulta is
  'Secreto por pedido para el link público de seguimiento (/pedido/<numero>?t=<token>).';
comment on column orders.seguimiento is
  'Número de envío de Andreani, cargado a mano desde el panel. null = todavía no despachado.';
comment on column orders.estado_actualizado_at is
  'Última vez que cambió `estado`. Se setea desde la app en cada transición.';
