-- =============================================================================
-- Bookmist — Migración 0035: registrar la venta en Analytics desde el servidor
--
-- Motivada por un bug real que encontró Dani (2026-09-05): en Analytics solo
-- aparecían las compras por transferencia. El evento `purchase` lo mandaba el
-- navegador desde la página de confirmación, y eso funciona mientras quien
-- compra no se vaya del sitio — con Mercado Pago se va a la pasarela y la
-- vuelta muchas veces cae en otra pestaña, o directamente no vuelve nunca
-- (cierra la app después de pagar, o paga en efectivo dos días después).
--
-- La única forma de contar esas ventas es mandarlas desde el servidor, cuando
-- el webhook de Mercado Pago confirma el pago. Estas tres columnas son lo que
-- eso necesita.
--
-- ga_client_id / ga_session_id
--   GA4 identifica al visitante por un client_id que vive en la cookie `_ga`
--   del navegador, y a la visita por un session_id que vive en `_ga_<flujo>`.
--   Se capturan en el checkout (única vez que el navegador y el pedido están
--   los dos presentes) porque sin ellos el evento del servidor entra como una
--   visita nueva sin origen: la venta se contaría, pero Analytics no sabría
--   que vino de Instagram, de una búsqueda o de un anuncio — que es más o
--   menos lo único para lo que sirve mirar de dónde vienen las ventas.
--   Nullable a propósito: si el visitante bloquea Analytics no hay cookie, y
--   eso no puede frenar una venta.
--
-- ga_purchase_enviado_at
--   Marca de "esta venta ya se contó", para no contarla dos veces. Hace falta
--   porque Mercado Pago reintenta el mismo aviso varias veces y porque
--   confirmar_pago_pedido (migración 0022) devuelve true también en los
--   reintentos, así que no sirve para distinguir la primera confirmación.
--   El webhook la reclama con un update condicional (`is null`), que Postgres
--   resuelve fila por fila: gana uno solo aunque lleguen dos avisos juntos.
-- =============================================================================

alter table orders
  add column ga_client_id text,
  add column ga_session_id text,
  add column ga_purchase_enviado_at timestamptz;

comment on column orders.ga_client_id is
  'client_id de GA4 (cookie _ga) capturado en el checkout, para que la venta que manda el servidor conserve el origen del visitante. null = el navegador no tenía Analytics.';
comment on column orders.ga_session_id is
  'session_id de GA4 (cookie _ga_<flujo>) capturado en el checkout. Sin esto GA4 abre una sesión nueva para el evento del servidor.';
comment on column orders.ga_purchase_enviado_at is
  'Cuándo se mandó el evento `purchase` a GA4 desde el servidor. null = todavía no. Evita contar dos veces cuando Mercado Pago reintenta el aviso.';
