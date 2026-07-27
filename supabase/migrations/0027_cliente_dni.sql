-- =============================================================================
-- Bookmist — Migración 0027: DNI del cliente en los pedidos
-- Pedido de Dani vía Trello: pide el DNI en el formulario de pedido. Not null
-- con default '' (mismo criterio que la migración 0023 con peso_gramos): hay
-- pedidos reales ya en producción sin este dato, así que no puede exigirse a
-- nivel de base para las filas existentes — la obligatoriedad real la aplica
-- el checkout (checkoutSchema en src/lib/validations.ts) para los pedidos
-- nuevos de acá en más.
-- =============================================================================

alter table orders add column cliente_dni text not null default '';
