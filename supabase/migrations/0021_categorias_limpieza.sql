-- =============================================================================
-- Bookmist — Migración 0021: categorías reales (Fase 6i, paso 2 de 2)
-- Post-deploy: el código ya no lee productos.categoria/productos.destacado
-- ni llama a categorias_distintas() (commit fd9ea81, ya en producción desde
-- antes de correr esto) — se puede limpiar sin romper nada.
-- =============================================================================

drop function categorias_distintas();

alter table productos drop column categoria;
alter table productos drop column destacado;
