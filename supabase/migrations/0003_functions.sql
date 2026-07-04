-- =============================================================================
-- Bookmist — Migración 0003: funciones y triggers
-- =============================================================================

-- updated_at automático en productos / items_catalogo ------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger productos_set_updated_at
  before update on productos
  for each row
  execute function set_updated_at();

create trigger items_catalogo_set_updated_at
  before update on items_catalogo
  for each row
  execute function set_updated_at();

-- Géneros/categorías distintas en uso (para el filtro/grilla del catálogo) ---
-- Mismo patrón que Martín Libros: SELECT DISTINCT real en la base en vez de
-- confiar en una muestra capada por PostgREST.
create or replace function categorias_distintas()
returns table (categoria text)
language sql
stable
security invoker
as $$
  select distinct p.categoria
  from productos p
  where p.activo = true and p.categoria is not null;
$$;

grant execute on function categorias_distintas() to anon, authenticated;
