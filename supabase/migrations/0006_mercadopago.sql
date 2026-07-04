-- =============================================================================
-- Bookmist — Migración 0006: pago online con Mercado Pago (Fase 3)
-- Checkout Pro cubre QR, billetera Mercado Pago y tarjetas en una sola
-- integración (no hace falta una integración de QR de punto de venta
-- separada: Bookmist no tiene local físico, todo se paga online).
-- =============================================================================

alter type metodo_pago add value 'mercadopago';

alter table orders add column mp_preference_id text;
alter table orders add column mp_payment_id    text;
