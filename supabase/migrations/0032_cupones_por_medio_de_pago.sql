-- =============================================================================
-- Bookmist — Migración 0032: cupones atados a un medio de pago
--
-- Pedido de Dani: quiere un cupón del 10% que valga SOLO pagando por
-- transferencia. Hasta acá un cupón se aplicaba con cualquier medio, así que
-- ese 10% se le sumaba también a quien paga con Mercado Pago — donde la
-- comisión se la come entera y el descuento sale de su bolsillo dos veces.
--
-- metodo_pago_requerido
--   null                = sirve con cualquier medio (todos los cupones que ya
--                         existen quedan así, que es como venían funcionando).
--   'transferencia'     = solo si el pedido se paga por transferencia.
--   'mercadopago'       = solo si se paga con Mercado Pago.
--
-- Es la columna de UN medio y no una lista: hoy el checkout ofrece dos
-- opciones, así que "todos" y "uno solo" cubren todos los casos posibles. Si
-- alguna vez hay tres medios y hace falta "estos dos sí, este no", se
-- reemplaza por un array — pero inventar hoy esa complejidad sería adivinar.
--
-- Usa el enum metodo_pago que ya existe (0004/0006/0016), no un texto libre:
-- así la base misma rechaza un valor que el checkout no sabría interpretar, y
-- el día que se agregue un medio nuevo aparece solo como opción válida.
-- =============================================================================

alter table cupones
  add column metodo_pago_requerido metodo_pago;

comment on column cupones.metodo_pago_requerido is
  'Medio de pago exigido por este cupón. null = sirve con cualquiera.';
