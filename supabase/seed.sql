-- =============================================================================
-- Bookmist — Datos de ejemplo (seed)
-- Idempotente: se puede volver a correr sin duplicar filas (on conflict do
-- nothing sobre las restricciones únicas). Nombres/precios tomados del
-- wireframe de referencia (BookmistLanding.jsx) — reemplazar por el catálogo
-- real de Daniela apenas esté definido.
-- =============================================================================

-- Zonas de envío (costo manual, Fase 4a — ver README) ------------------------
insert into zonas_envio (nombre, costo, activo, orden) values
  ('CABA y GBA',                 3500, true, 1),
  ('Resto de Buenos Aires',      4500, true, 2),
  ('Resto del país',             5500, true, 3)
on conflict (nombre) do nothing;

-- Biblioteca reusable de libros/accesorios -----------------------------------
insert into items_catalogo (tipo, nombre, autor, descripcion) values
  ('libro',     'Sombras en la Niebla',              'Valeria Cortez',  'Novela de terror gótico ambientada en un pueblo costero.'),
  ('accesorio', 'Vela aromática de lavanda',          null,              'Vela de soja con aroma a lavanda, ideal para leer de noche.'),
  ('libro',     'Crónicas de Luna Llena (Tomo 1)',    'Studio Kaen',     'Primer tomo de la saga manga sobre cazadoras de sombras.'),
  ('accesorio', 'Marcapáginas de metal - Luna',       null,              'Marcapáginas troquelado en forma de luna creciente.'),
  ('accesorio', 'Postal ilustrada - Edición Luna',    null,              'Postal con arte exclusivo de la edición.'),
  ('libro',     'El Silbido del Andén',               'Marcos Ibáñez',   'Thriller psicológico sobre un tren que nunca llega a destino.'),
  ('accesorio', 'Taza térmica Bookmist',              null,              'Taza de cerámica con frase de la colección.'),
  ('accesorio', 'Set de marcapáginas de otoño (x4)',  null,              'Cuatro marcapáginas de tela con motivos otoñales.'),
  ('accesorio', 'Cinta de raso para marcapáginas',    null,              'Cinta de raso para usar como separador de libros.')
on conflict (nombre) do nothing;

-- Productos (cajas y kits) ----------------------------------------------------
insert into productos (slug, nombre, tipo, categoria, descripcion, precio, stock, destacado, activo, orden) values
  ('kit-terror-en-la-bruma',      'Kit Terror en la Bruma',        'caja', 'Terror',    'Una novela de terror gótico junto con una vela aromática para leer en penumbras.', 24900, 12, true, true, 1),
  ('caja-manga-edicion-luna',     'Caja Manga · Edición Luna',      'caja', 'Manga',     'El primer tomo de una saga manga con marcapáginas y postal ilustrada de edición limitada.', 19500, 8,  true, true, 2),
  ('kit-thriller-nocturno',       'Kit Thriller Nocturno',          'caja', 'Thriller',  'Un thriller psicológico para no soltar, acompañado de una taza térmica de la colección.', 22300, 10, true, true, 3),
  ('set-marcapaginas-de-otono',   'Set Marcapáginas de Otoño',      'kit',  'Accesorios','Cuatro marcapáginas de tela con motivos otoñales y una cinta de raso a juego.', 8900, 20, true, true, 4)
on conflict (slug) do nothing;

-- Contenido curado de cada producto ("qué incluye") --------------------------
insert into producto_items (producto_id, item_id, cantidad, orden)
select p.id, i.id, v.cantidad, v.orden
from (values
  ('kit-terror-en-la-bruma',    'Sombras en la Niebla',             1, 1),
  ('kit-terror-en-la-bruma',    'Vela aromática de lavanda',        1, 2),
  ('caja-manga-edicion-luna',   'Crónicas de Luna Llena (Tomo 1)',  1, 1),
  ('caja-manga-edicion-luna',   'Marcapáginas de metal - Luna',     1, 2),
  ('caja-manga-edicion-luna',   'Postal ilustrada - Edición Luna',  1, 3),
  ('kit-thriller-nocturno',     'El Silbido del Andén',             1, 1),
  ('kit-thriller-nocturno',     'Taza térmica Bookmist',            1, 2),
  ('set-marcapaginas-de-otono', 'Set de marcapáginas de otoño (x4)',1, 1),
  ('set-marcapaginas-de-otono', 'Cinta de raso para marcapáginas',  1, 2)
) as v(producto_slug, item_nombre, cantidad, orden)
join productos p      on p.slug   = v.producto_slug
join items_catalogo i on i.nombre = v.item_nombre
on conflict (producto_id, item_id) do nothing;

-- Secciones de la home (Fase 5b) — mismo contenido que ya estaba hardcodeado,
-- ahora editable desde /admin/pagina. Si nunca se corre este seed, la home
-- sigue mostrando este mismo contenido por defecto (ver src/lib/secciones.ts).
insert into pagina_secciones (pagina, tipo, orden, activo, config) values
  ('home', 'hero', 1, true, '{
    "eyebrow": "Bookmist Editorial",
    "titulo": "Palabras que se sienten en las manos",
    "subtitulo": "Kits literarios pensados para pausar el ruido y perderte, otra vez, en una buena historia.",
    "ctaTexto": "Descubrir los kits"
  }'),
  ('home', 'beneficios', 2, true, '{
    "items": [
      { "emoji": "💳", "texto": "3 cuotas sin interés +$75.000" },
      { "emoji": "📦", "texto": "Envíos a todo el país" },
      { "emoji": "💸", "texto": "10% OFF transferencia" }
    ]
  }'),
  ('home', 'categorias', 3, true, '{
    "eyebrow": "Explorá",
    "titulo": "Nuestras categorías"
  }'),
  ('home', 'mas_vendidos', 4, true, '{
    "eyebrow": "Los favoritos de la comunidad",
    "titulo": "Más vendidos"
  }'),
  ('home', 'sobre_mi', 5, true, '{
    "eyebrow": "Sobre mí",
    "titulo": "Hola, soy Daniela",
    "texto": "Soy Daniela, y este emprendimiento nace de mi pasión por descubrir historias increíbles. Siempre fui de sumergirme en el terror, los thrillers, la ficción contemporánea y el manga...",
    "texto2": "Este es un proyecto que armo con las manos y con calma, pensando cada kit como si fuera un regalo para una amiga lectora.",
    "firma": "— Daniela, fundadora de Bookmist"
  }'),
  ('home', 'resenas', 6, true, '{
    "eyebrow": "Lo que dicen nuestras lectoras",
    "titulo": "Reseñas",
    "items": [
      { "nombre": "Martina R.", "texto": "Abrí la caja y sentí que me abrazaban. Cada detalle tiene alma, se nota que está pensado con cariño." },
      { "nombre": "Lucía G.", "texto": "El marcapáginas de plumas es precioso, y el libro que eligieron para mí fue exactamente lo que necesitaba leer." },
      { "nombre": "Sofía P.", "texto": "Se nota el cuidado en cada textura. Mi rincón de lectura ahora es muchísimo más lindo gracias a Bookmist." }
    ]
  }'),
  ('home', 'instagram', 7, true, '{}')
on conflict (pagina, tipo) do nothing;
