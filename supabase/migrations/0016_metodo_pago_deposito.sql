-- =============================================================================
-- Bookmist — Migración 0016: método de pago "depósito bancario" (Fase 6g)
-- Comparte los mismos datos de cuenta que "transferencia" (mismo destino,
-- distinta forma de enviarlo: online vs. en una sucursal/cajero) — ver
-- getDatosTransferencia() en src/lib/configuracion.ts.
-- =============================================================================

alter type metodo_pago add value 'deposito';
