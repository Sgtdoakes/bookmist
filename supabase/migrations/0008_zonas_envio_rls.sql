-- =============================================================================
-- Bookmist — Migración 0008: RLS de zonas_envio
-- Mismo patrón que productos: el público solo ve zonas activas; el admin
-- (authenticated) tiene acceso total.
-- =============================================================================

alter table zonas_envio enable row level security;

create policy "zonas_envio_select_publico"
  on zonas_envio for select
  to anon
  using (activo = true);

create policy "zonas_envio_admin_total"
  on zonas_envio for all
  to authenticated
  using (true)
  with check (true);
