-- =============================================================================
-- Bookmist — Migración 0031: variantes para cualquier tipo de producto
-- Pedido de Dani: los vitrales (tipo "accesorio") vienen en varios colores y
-- no había forma de agruparlos — el bloque "Variantes" de la ficha ni
-- aparecía, porque la 0028 restringía `variante_grupo_id` a cajas/kits.
--
-- Se cae esa restricción: cualquier producto puede ser variante de cualquier
-- otro (decisión del usuario). El modelo no cambia — `variante_grupo_id`
-- sigue siendo el mismo tag compartido sin tabla propia de la 0028, y
-- `variante_etiqueta` sigue siendo el texto corto de cada integrante.
-- =============================================================================

alter table productos
  drop constraint if exists productos_variante_solo_cajas_kits;
