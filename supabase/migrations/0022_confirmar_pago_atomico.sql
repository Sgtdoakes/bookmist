-- =============================================================================
-- Bookmist — Migración 0022: confirmación de pago atómica
-- Motivada por un fallo real (pedido BM-0003): el webhook marcó el pedido
-- como pagado pero el descuento de stock, que era un paso separado en JS,
-- falló en silencio — sobreventa en potencia. Esta función hace las dos
-- cosas en UNA transacción: o se persisten juntas, o ninguna.
--
-- Idempotente a propósito: MP reintenta el mismo aviso varias veces. El
-- `for update` bloquea la fila contra dos webhooks concurrentes, y si el
-- pedido ya está pagado devuelve true sin tocar el stock de nuevo.
-- =============================================================================

create or replace function confirmar_pago_pedido(p_order_id uuid, p_payment_id text)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_estado estado_pedido;
begin
  select estado into v_estado from orders where id = p_order_id for update;
  if v_estado is null then
    return false; -- el pedido no existe (p. ej. fue borrado): nada que hacer
  end if;
  if v_estado = 'pagado' then
    return true; -- reintento de MP: ya estaba procesado
  end if;

  update orders
  set estado = 'pagado', mp_payment_id = p_payment_id
  where id = p_order_id;

  update productos p
  set stock = greatest(0, p.stock - oi.cantidad)
  from order_items oi
  where oi.order_id = p_order_id
    and oi.producto_id = p.id;

  return true;
end;
$$;

-- Solo el server (service role) confirma pagos — nunca el navegador.
revoke execute on function confirmar_pago_pedido(uuid, text) from public, anon, authenticated;
grant execute on function confirmar_pago_pedido(uuid, text) to service_role;
