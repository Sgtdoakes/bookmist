-- =============================================================================
-- Bookmist — Migración 0018: ampliar producto_tipo (Fase 6h, paso 2 de 3)
-- La fusión de biblioteca en productos (migración 0017) necesita que un
-- producto pueda ser "libro" o "accesorio" además de "caja"/"kit" — si no,
-- cada ítem migrado quedaría con un tipo que no le corresponde.
-- =============================================================================

alter type producto_tipo add value 'libro';
alter type producto_tipo add value 'accesorio';
