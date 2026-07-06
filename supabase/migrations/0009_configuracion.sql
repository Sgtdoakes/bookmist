-- =============================================================================
-- Bookmist — Migración 0009: configuración (KV) — Fase 5
-- Tabla chica de clave/valor para ajustes que no ameritan su propia tabla.
-- Primer uso: el modo "reponiendo stock" (ver src/lib/mantenimiento.ts).
--   mantenimiento_activo  -> 'true' | 'false'
--   mantenimiento_motivo  -> 'auto_sin_stock' | 'manual'
--   mantenimiento_mensaje -> texto libre (opcional, hay uno por defecto en el código)
-- =============================================================================

create table configuracion (
  clave      text primary key,
  valor      text not null,
  updated_at timestamptz not null default now()
);

alter table configuracion enable row level security;

create policy "configuracion_select_publico"
  on configuracion for select
  to anon
  using (true);

create policy "configuracion_admin_total"
  on configuracion for all
  to authenticated
  using (true)
  with check (true);
