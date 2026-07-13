-- =============================================================================
-- Bookmist — Migración 0023: cotización Andreani + descuento por transferencia
--
-- Peso y medidas por producto: la API de cotización de Andreani exige
-- dimensiones y gramos de cada bulto — sin eso no cotiza. Los defaults son
-- de un paquete chico genérico; Dani los ajusta por producto desde el admin
-- (los boxes literarios pesan ~10x más que un marcapáginas).
--
-- orders.descuento: el 10% por pagar con transferencia (la promesa de la
-- barra de beneficios) pasa a ser real — se guarda el monto descontado para
-- que el desglose del pedido siempre cierre: total = items - descuento + envío.
-- =============================================================================

alter table productos
  add column peso_gramos integer not null default 300,
  add column alto_cm     integer not null default 5,
  add column ancho_cm    integer not null default 20,
  add column largo_cm    integer not null default 30,
  add constraint productos_peso_positivo    check (peso_gramos > 0),
  add constraint productos_medidas_positivas check (alto_cm > 0 and ancho_cm > 0 and largo_cm > 0);

alter table orders
  add column descuento numeric(10,2) not null default 0,
  add constraint orders_descuento_no_negativo check (descuento >= 0);
