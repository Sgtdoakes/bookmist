-- =============================================================================
-- Bookmist — Migración 0005: RLS de pedidos
-- Sin políticas para anon => el público no puede leer ni escribir pedidos.
-- Los pedidos se crean desde el backend con la SERVICE ROLE KEY (que ignora
-- RLS), nunca desde el navegador — mismo patrón que productos/items_catalogo.
-- =============================================================================

alter table orders      enable row level security;
alter table order_items enable row level security;

create policy "orders_admin_total"
  on orders for all
  to authenticated
  using (true)
  with check (true);

create policy "order_items_admin_total"
  on order_items for all
  to authenticated
  using (true)
  with check (true);
