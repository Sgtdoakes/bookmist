-- =============================================================================
-- Bookmist — Migración 0015: contenido real de Contacto / Preguntas
-- frecuentes / Política de devolución (Fase 6f-3)
-- NAV_LINKS ya tenía estos 3 links desde el arranque del proyecto, apuntando
-- a "#" a propósito porque las páginas no existían todavía. Ahora sí: se
-- crean como páginas institucionales (mismo mecanismo de la Fase 6f-2, sin
-- código nuevo) con contenido inicial editable desde /admin/pagina, y se
-- actualizan los 3 links de nav_links para que apunten a ellas.
--
-- El texto de Preguntas frecuentes y Política de devolución es un punto de
-- partida razonable, no asesoramiento legal — Dani lo puede (y debería)
-- ajustar con los datos reales del negocio desde el admin.
-- =============================================================================

insert into paginas (slug, titulo, sistema, orden) values
  ('contacto', 'Contacto', false, 10),
  ('preguntas-frecuentes', 'Preguntas frecuentes', false, 11),
  ('politica-de-devolucion', 'Política de devolución', false, 12);

-- --- Contacto ----------------------------------------------------------
insert into pagina_secciones (pagina, tipo, orden, config) values
  ('contacto', 'texto', 0, jsonb_build_object(
    'eyebrow', 'Estamos para ayudarte',
    'titulo', 'Contacto',
    'texto', 'Escribinos por WhatsApp (el botón flotante está abajo a la derecha) o por mail y te respondemos a la brevedad. También podés encontrarnos en Instagram y TikTok — los links están en el pie de página.',
    'ctaTexto', 'Ver productos',
    'ctaHref', '/productos',
    'estilo', '{}'::jsonb
  ));

-- --- Preguntas frecuentes (una sección "texto" por pregunta) -----------
insert into pagina_secciones (pagina, tipo, orden, config) values
  ('preguntas-frecuentes', 'texto', 0, jsonb_build_object(
    'eyebrow', '', 'titulo', '¿Cómo elijo qué caja o kit comprar?',
    'texto', 'Cada caja y kit tiene su propia ficha con la descripción y qué incluye. Podés explorar por categoría desde el catálogo o escribirnos si querés una recomendación personalizada.',
    'ctaTexto', '', 'ctaHref', '', 'estilo', '{}'::jsonb
  )),
  ('preguntas-frecuentes', 'texto', 1, jsonb_build_object(
    'eyebrow', '', 'titulo', '¿Cuánto tarda el envío y a dónde envían?',
    'texto', 'Enviamos a todo el país con Andreani. El tiempo de entrega depende de la zona; una vez despachado el pedido te avisamos con el seguimiento.',
    'ctaTexto', '', 'ctaHref', '', 'estilo', '{}'::jsonb
  )),
  ('preguntas-frecuentes', 'texto', 2, jsonb_build_object(
    'eyebrow', '', 'titulo', '¿Qué métodos de pago aceptan?',
    'texto', 'Transferencia bancaria (con descuento), efectivo y Mercado Pago (QR, billetera o tarjeta). Elegís el método al finalizar tu compra.',
    'ctaTexto', '', 'ctaHref', '', 'estilo', '{}'::jsonb
  )),
  ('preguntas-frecuentes', 'texto', 3, jsonb_build_object(
    'eyebrow', '', 'titulo', '¿Puedo elegir el libro que viene en la caja?',
    'texto', 'Cada caja tiene una selección curada pensada para la experiencia completa. Si buscás algo puntual, escribinos antes de comprar y te contamos qué opciones hay.',
    'ctaTexto', '', 'ctaHref', '', 'estilo', '{}'::jsonb
  )),
  ('preguntas-frecuentes', 'texto', 4, jsonb_build_object(
    'eyebrow', '', 'titulo', '¿Cómo consulto por mi pedido?',
    'texto', 'Escribinos por WhatsApp con tu número de pedido y te contamos el estado. También podés escribirnos por mail.',
    'ctaTexto', 'Ir a Contacto', 'ctaHref', '/contacto', 'estilo', '{}'::jsonb
  ));

-- --- Política de devolución ---------------------------------------------
insert into pagina_secciones (pagina, tipo, orden, config) values
  ('politica-de-devolucion', 'texto', 0, jsonb_build_object(
    'eyebrow', '', 'titulo', 'Derecho de arrepentimiento',
    'texto', 'Como en toda compra online en Argentina, tenés 10 días corridos desde que recibís tu pedido para arrepentirte de la compra, sin necesidad de justificar el motivo. El producto tiene que estar sin usar y en su embalaje original.',
    'ctaTexto', '', 'ctaHref', '', 'estilo', '{}'::jsonb
  )),
  ('politica-de-devolucion', 'texto', 1, jsonb_build_object(
    'eyebrow', '', 'titulo', 'Cómo pedir una devolución',
    'texto', 'Escribinos por WhatsApp o por mail dentro de los 10 días con tu número de pedido. Te confirmamos los pasos para la devolución y, una vez que recibimos el producto en las condiciones originales, te reintegramos el pago.',
    'ctaTexto', 'Ir a Contacto', 'ctaHref', '/contacto', 'estilo', '{}'::jsonb
  )),
  ('politica-de-devolucion', 'texto', 2, jsonb_build_object(
    'eyebrow', '', 'titulo', 'Productos con algún problema',
    'texto', 'Si tu caja o kit llegó dañado o con un faltante, escribinos con fotos apenas lo recibas y lo resolvemos sin costo para vos.',
    'ctaTexto', '', 'ctaHref', '', 'estilo', '{}'::jsonb
  ));

-- --- Apuntar los 3 links del nav a las páginas reales -------------------
update nav_links set href = '/contacto' where href = '#' and label = 'Contacto';
update nav_links set href = '/preguntas-frecuentes' where href = '#' and label = 'Preguntas frecuentes';
update nav_links set href = '/politica-de-devolucion' where href = '#' and label = 'Política de devolución';
