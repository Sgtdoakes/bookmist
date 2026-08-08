-- =============================================================================
-- Bookmist — Migración 0030: cupones editables y usos medibles de verdad
--
-- Dos cambios, los dos por el mismo caso real: Dani imprimió 30 papeles que
-- dicen "BIENVENIDOS" a secas (no los códigos únicos que generaba el panel),
-- ya los está repartiendo, y no se les puede escribir nada encima.
--
-- 1) usos_maximos_por_email
--    Reemplaza al booleano una_vez_por_email por un número. Con un código
--    repetido en 30 papeles, el papel no prueba nada: quien tipea el código
--    manda lo mismo tenga 1 papel o 10. El cupo total (usos_maximos) acota
--    el daño a lo que se imprimió, y este número acota cuánto puede llevarse
--    UNA persona — 1 es el viejo comportamiento, 2 o 3 deja pasar a quien de
--    verdad juntó varios papeles, null es sin límite por persona.
--
-- 2) orders.cupon_id
--    Hasta acá los usos se contaban por orders.cupon_codigo, o sea por el
--    STRING. Eso funcionaba mientras los códigos no se pudieran editar —
--    pero ahora sí se editan, y renombrar un cupón usado 18 veces reseteaba
--    la cuenta a cero y regalaba 30 descuentos más sin que nadie lo notara.
--    Con el id, los usos siguen al cupón aunque cambie de nombre.
--    cupon_codigo se queda igual: es el registro histórico de qué tipeó el
--    cliente, y sobrevive aunque el cupón se borre.
-- =============================================================================

alter table cupones
  add column usos_maximos_por_email int
    check (usos_maximos_por_email is null or usos_maximos_por_email > 0);

-- El de bienvenida era "uno por mail"; se traduce a 1.
update cupones set usos_maximos_por_email = 1 where una_vez_por_email;

-- una_vez_por_email queda en la tabla sin que nadie lo lea, igual que las
-- claves cupon_bienvenida_* de la 0029: borrarlo en la misma migración que
-- lo reemplaza dejaría al sitio roto si hubiera que volver atrás el deploy.
-- Tiene default false, así que los inserts del código nuevo (que ya no lo
-- mandan) siguen andando.

alter table orders
  add column cupon_id uuid references cupones(id) on delete set null;

-- Los pedidos que ya usaron un cupón que todavía existe quedan enlazados.
-- Los de cupones ya borrados se quedan con cupon_codigo solo, que es todo lo
-- que se puede saber de ellos.
update orders o
set cupon_id = c.id
from cupones c
where o.cupon_codigo is not null
  and upper(o.cupon_codigo) = upper(c.codigo);

create index orders_cupon_id_idx on orders (cupon_id) where cupon_id is not null;
