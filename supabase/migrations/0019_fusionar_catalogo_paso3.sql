-- =============================================================================
-- Bookmist — Migración 0019 (paso 3 de 3): borrar items_catalogo
-- Los datos ya viven en `productos` (script de copia corrido antes de esto):
-- 9 ítems copiados como productos inactivos, 12 marcapáginas salteados por
-- estar ya cargados como productos reales. Las políticas RLS y el trigger
-- de updated_at caen solos con la tabla.
-- =============================================================================

drop table items_catalogo;
drop type item_tipo;
