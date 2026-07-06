-- =============================================================================
-- Bookmist — Migración 0012: lienzo libre de secciones (Fase 6c)
-- Saca el límite de "un tipo por página" para permitir varios bloques del
-- mismo tipo (ej. dos bloques de texto, dos carruseles de productos con
-- fuentes distintas) — el motor de bloques deja de ser un set fijo.
-- =============================================================================

alter table pagina_secciones
  drop constraint pagina_secciones_pagina_tipo_unico;
