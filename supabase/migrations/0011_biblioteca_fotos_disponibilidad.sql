-- =============================================================================
-- Bookmist — Migración 0011: fotos y disponibilidad de biblioteca (Fase 6a)
-- Agrega infraestructura de Storage para fotos de productos/items, y las
-- columnas necesarias para gestionar disponibilidad general y galería desde
-- el panel. `imagen`/`imagen_principal` (migración 0001) siguen siendo la
-- portada; `imagenes_galeria` son fotos adicionales, en el orden del array.
-- =============================================================================

-- Bucket de Storage para fotos de productos e ítems de biblioteca -------------
insert into storage.buckets (id, name, public)
values ('catalogo', 'catalogo', true)
on conflict (id) do nothing;

create policy "catalogo_lectura_publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'catalogo');

create policy "catalogo_escritura_autenticados"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'catalogo')
  with check (bucket_id = 'catalogo');

-- items_catalogo: disponibilidad general + galería ----------------------------
alter table items_catalogo
  add column activo           boolean     not null default true,
  add column imagenes_galeria text[]      not null default '{}';

create index items_catalogo_activo_idx on items_catalogo (activo);

-- productos: galería (la portada ya existe como imagen_principal) ------------
alter table productos
  add column imagenes_galeria text[] not null default '{}';
