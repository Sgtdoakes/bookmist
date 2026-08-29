-- =============================================================================
-- Bookmist — Migración 0034: estados de envío
--
-- Los tres estados originales (0004) contaban la historia de la PLATA:
-- pendiente → pagado → cancelado. Al cliente eso no le dice nada útil una vez
-- que pagó — lo que quiere saber es dónde está su paquete. Se suman los dos
-- estados que faltaban, en su orden lógico:
--
--   pendiente → pagado → enviado → entregado
--                                → cancelado (desde cualquiera de los tres)
--
-- VA EN UN ARCHIVO APARTE DE LA 0033 A PROPÓSITO: Postgres no permite USAR un
-- valor de enum en la misma transacción en que se lo agrega. Si esto viviera
-- junto a un update/insert que ya escriba 'enviado', la migración fallaría con
-- "unsafe use of new value of enum type". Separado, cada archivo corre en su
-- propia transacción y el problema no existe.
--
-- El `after` importa: sin él los valores nuevos quedan al final, después de
-- 'cancelado', y cualquier `order by estado` los ordenaría mal.
--
-- OJO: quitar un valor de un enum en Postgres no se puede sin recrear el tipo.
-- Estos dos estados vienen para quedarse.
-- =============================================================================

alter type estado_pedido add value if not exists 'enviado'   after 'pagado';
alter type estado_pedido add value if not exists 'entregado' after 'enviado';
