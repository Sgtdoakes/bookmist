-- =============================================================================
-- Bookmist — Migración 0024: bloques "Productos" referencian categoría por
-- slug, no por nombre
--
-- Bug: los bloques "Productos"/"Más vendidos" con fuente = 'categoria'
-- guardaban en config.categoria el NOMBRE de la categoría (ej. "Kits y cajas
-- literarias") en vez de su slug. El nombre se puede editar en cualquier
-- momento desde "Categorías del catálogo" (/admin/productos) — el slug queda
-- fijo de por vida (ver comentario en renombrarCategoria(), admin/productos/
-- actions.ts). Resultado: apenas Dani renombraba una categoría, el bloque que
-- la mostraba dejaba de encontrar productos (0 resultados) y la sección
-- entera desaparecía de la página en silencio, sin ningún aviso de error —
-- daba la sensación de que "no se pudo renombrar".
--
-- Esta migración convierte los config.categoria ya guardados de nombre a
-- slug, para que las páginas existentes sigan mostrando lo mismo que hoy
-- después del fix de código (getProductosPorCategoria ahora filtra por
-- categorias.slug).
-- =============================================================================

update pagina_secciones ps
set config = jsonb_set(ps.config, '{categoria}', to_jsonb(c.slug))
from categorias c
where ps.tipo in ('productos', 'mas_vendidos')
  and ps.config->>'fuente' = 'categoria'
  and ps.config->>'categoria' = c.nombre;
