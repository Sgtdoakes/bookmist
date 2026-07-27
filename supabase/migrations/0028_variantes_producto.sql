-- =============================================================================
-- Bookmist — Migración 0028: variantes de producto (Fase 8g)
-- Pedido de Dani vía Trello: poder marcar productos como variantes entre sí
-- (ej. un kit literario en distintos colores) y mostrar un selector en la
-- ficha pública que lleve directo a la otra variante.
--
-- `variante_grupo_id` es un tag compartido sin tabla propia: todos los
-- productos con el mismo valor son variantes entre sí (simétrico, sin
-- relación padre/hijo). Se genera con gen_random_uuid() en el momento en que
-- se arma el primer grupo, no hace falta una tabla "grupos" aparte porque el
-- grupo no tiene atributos propios — cada producto ya trae su propia etiqueta
-- en `variante_etiqueta` (ej. "Celeste").
--
-- Restringido a cajas/kits (decisión del usuario): el resto de los tipos
-- (libro/accesorio) no puede agruparse por ahora.
-- =============================================================================

alter table productos
  add column variante_grupo_id uuid,
  add column variante_etiqueta text,
  add constraint productos_variante_solo_cajas_kits
    check (variante_grupo_id is null or tipo in ('caja', 'kit'));

create index productos_variante_grupo_id_idx on productos (variante_grupo_id);
