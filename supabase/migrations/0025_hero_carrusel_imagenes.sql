-- =============================================================================
-- Bookmist — Migración 0025: hero pasa a carrusel (Fase 8d)
--
-- HeroConfig.imagen (string | null, una sola foto) se reemplaza por
-- HeroConfig.imagenes (string[], 0 a N fotos/videos que rotan solas). Esta
-- migración convierte los config ya guardados con el campo viejo: si tenían
-- una foto cargada, pasa a ser el primer (y único, por ahora) slide del
-- carrusel — nadie pierde la imagen que ya tenía puesta.
-- =============================================================================

update pagina_secciones
set config = (config - 'imagen') || jsonb_build_object(
  'imagenes',
  case
    when config->>'imagen' is not null and config->>'imagen' <> '' then jsonb_build_array(config->>'imagen')
    else '[]'::jsonb
  end
)
where tipo = 'hero' and config ? 'imagen';
