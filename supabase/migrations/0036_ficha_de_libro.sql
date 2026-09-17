-- =============================================================================
-- Bookmist — Migración 0036: ficha de libro
-- Pedido de Dani: vender libros sueltos, no solo cajas y kits.
--
-- El tipo 'libro' ya existía desde la 0018 (fusión de la biblioteca con el
-- catálogo) y `autor` es la única columna propia de libro que hay hoy — pero
-- en producción no hay ni un producto de ese tipo, porque un libro sin
-- editorial, ISBN ni páginas queda con menos información que en cualquier
-- librería online. Estas columnas son eso.
--
-- Todas nullable y sin check contra `tipo` a propósito: el panel las muestra
-- solo cuando el tipo es 'libro', y una restricción en la base convertiría un
-- cambio de tipo (libro -> caja, al reorganizar el catálogo) en un error de
-- guardado en vez de un campo que deja de verse.
--
-- isbn NO es unique, a diferencia de Martín Libros. Acá el mismo título puede
-- entrar dos veces a propósito (una edición firmada, un ejemplar con otra
-- tapa), así que el duplicado se avisa en el panel —que además muestra cuál
-- es el producto que ya existe— en vez de rebotar el guardado. El índice es
-- para ese aviso y para el buscador del panel.
-- =============================================================================

alter table productos
  add column editorial text,
  add column isbn text,
  add column paginas integer,
  add column anio_publicacion integer,
  add column idioma text,
  add column formato text,
  add constraint productos_formato_valido
    check (formato is null or formato in ('blanda', 'dura')),
  add constraint productos_paginas_positivas
    check (paginas is null or paginas > 0),
  -- Cota ancha a propósito: solo atrapa el dedazo de tipeo (un año de 3 o 5
  -- dígitos), no opina sobre qué se puede vender.
  add constraint productos_anio_razonable
    check (anio_publicacion is null or anio_publicacion between 1000 and 2200);

create index productos_isbn_idx on productos (isbn) where isbn is not null;

comment on column productos.editorial is
  'Sello editorial. Solo aplica a productos tipo "libro".';
comment on column productos.isbn is
  'ISBN-10 o ISBN-13, solo dígitos. No es unique: el mismo título puede cargarse dos veces (edición firmada, otra tapa). El panel avisa del duplicado.';
comment on column productos.paginas is
  'Cantidad de páginas. Viene de Google Books al autocompletar por ISBN; el catálogo de Martín Libros no lo tiene.';
comment on column productos.anio_publicacion is
  'Año de publicación de la edición.';
comment on column productos.idioma is
  'Idioma del libro, escrito para mostrar ("Español"). No es un código ISO: se ve tal cual en la ficha.';
comment on column productos.formato is
  'Encuadernación: "blanda" o "dura". null = no se muestra la línea en la ficha.';
