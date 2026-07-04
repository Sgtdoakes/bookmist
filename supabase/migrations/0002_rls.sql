-- =============================================================================
-- Bookmist — Migración 0002: Row Level Security (RLS)
-- Regla general:
--   * Público (anon): solo LECTURA. `productos` solo ve filas activas.
--     `items_catalogo`/`producto_items` no tienen datos sensibles ni PII (son
--     contenido descriptivo de marketing), así que se habilita lectura pública
--     sin condición — evita políticas con join para un beneficio de seguridad
--     nulo. Si en el futuro se agrega algo sensible a estas tablas, revisitar.
--   * Admin (authenticated): acceso total. Cualquier usuario que pueda iniciar
--     sesión es admin (mismo patrón que Martín Libros): el registro público se
--     deshabilita a mano en Supabase cuando se agregue auth (Fase 5).
-- =============================================================================

alter table productos      enable row level security;
alter table items_catalogo enable row level security;
alter table producto_items enable row level security;

-- productos ------------------------------------------------------------------
create policy "productos_select_publico"
  on productos for select
  to anon
  using (activo = true);

create policy "productos_admin_total"
  on productos for all
  to authenticated
  using (true)
  with check (true);

-- items_catalogo ---------------------------------------------------------------
create policy "items_catalogo_select_publico"
  on items_catalogo for select
  to anon
  using (true);

create policy "items_catalogo_admin_total"
  on items_catalogo for all
  to authenticated
  using (true)
  with check (true);

-- producto_items ---------------------------------------------------------------
create policy "producto_items_select_publico"
  on producto_items for select
  to anon
  using (true);

create policy "producto_items_admin_total"
  on producto_items for all
  to authenticated
  using (true)
  with check (true);
