-- =============================================================================
-- Bookmist — Migración 0017 (paso 1 de 2): fusionar biblioteca en productos
-- Pedido explícito de Dani: que cada libro/accesorio de la biblioteca sea
-- también un producto vendible por su cuenta, sin una tabla separada. Como
-- `producto_items` (qué incluye cada caja/kit) hoy tiene CERO filas en
-- producción, no hay datos de composición que migrar — solo hace falta
-- repuntar la relación para que en el futuro pueda apuntar a productos.
--
-- Este paso NO borra `items_catalogo` todavía — eso es el paso 2, después de
-- correr el script que copia sus filas a `productos`. Se hace en dos pasos
-- para no perder datos si algo sale mal en el medio.
-- =============================================================================

-- Los libros necesitan autor; los demás productos, no. Nullable a propósito.
alter table productos add column autor text;

-- `producto_items.item_id` pasa a apuntar a productos (self-referencial: un
-- producto "caja/kit" puede estar hecho de otros productos). No hay filas
-- que migrar (la tabla está vacía), así que solo cambia la restricción.
alter table producto_items drop constraint producto_items_item_id_fkey;
alter table producto_items
  add constraint producto_items_item_id_fkey
  foreign key (item_id) references productos(id) on delete restrict;
