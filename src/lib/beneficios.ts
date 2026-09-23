// Parte pura de los beneficios que se anuncian junto al precio: el precio con
// transferencia, las cuotas sin interés y la barra del carrito que dice cuánto
// falta para cada uno. Vive separada de src/lib/configuracion.ts —que consulta
// la base— porque la usan componentes cliente (la tarjeta de producto, el
// carrito, el panel). Mismo criterio que cintillo.ts / cupon-codigo.ts.

export type CuotasConfig = {
  // 0 o 1 = no se muestran cuotas en ningún lado.
  cantidad: number
  // Desde qué precio. 0 = desde cualquier monto.
  minimo: number
}

export type BeneficiosPrecio = {
  descuentoTransferenciaPct: number
  cuotas: CuotasConfig
  // 0 = envío gratis apagado (mismo valor que usa el checkout).
  envioGratisUmbral: number
}

// Mismo redondeo que /api/checkout: se redondea el descuento, no el precio
// final. Así lo que promete la tarjeta es exactamente lo que cobra el checkout
// para ese producto solo.
export function precioConTransferencia(precio: number, pct: number): number | null {
  if (!(precio > 0) || !(pct > 0) || pct > 100) return null
  return precio - Math.round(precio * (pct / 100))
}

// Las cuotas sin interés NO las decide el sitio: las da Mercado Pago según lo
// que Dani configuró en su cuenta. Esto solo dice cuánto queda cada una, con
// la misma cantidad y el mismo mínimo que se cargan en el panel.
export function cuotasSinInteres(precio: number, cuotas: CuotasConfig): { cantidad: number; monto: number } | null {
  const cantidad = Math.floor(cuotas.cantidad)
  if (!(precio > 0) || !(cantidad >= 2)) return null
  if (precio < Math.max(0, cuotas.minimo)) return null
  return { cantidad, monto: Math.round(precio / cantidad) }
}

export type MetaCarrito = { tipo: 'envio' | 'cuotas'; monto: number }

// Las metas que tiene sentido mostrar en la barra, de la más cercana a la más
// lejana. Una meta de monto 0 no se persigue (ya está cumplida siempre) y una
// regla apagada no aparece.
export function metasDelCarrito(b: BeneficiosPrecio): MetaCarrito[] {
  const metas: MetaCarrito[] = []
  if (b.envioGratisUmbral > 0) metas.push({ tipo: 'envio', monto: b.envioGratisUmbral })
  if (Math.floor(b.cuotas.cantidad) >= 2 && b.cuotas.minimo > 0) metas.push({ tipo: 'cuotas', monto: b.cuotas.minimo })
  return metas.sort((a, b) => a.monto - b.monto)
}

export type EstadoMeta = MetaCarrito & {
  alcanzada: boolean
  falta: number
  // Dónde cae la marca de esta meta sobre la barra, de 0 a 100.
  posicion: number
}

export type ProgresoCarrito = {
  metas: EstadoMeta[]
  // Cuánto de la barra está lleno, de 0 a 100. La barra entera es la meta
  // más lejana.
  porcentaje: number
  // La primera meta que falta, o null si ya están todas.
  siguiente: EstadoMeta | null
}

// El subtotal es el de productos a precio de lista, sin descuentos y sin envío:
// es exactamente contra lo que compara aplicarEnvioGratis() en el checkout.
export function progresoDelCarrito(subtotal: number, metas: MetaCarrito[]): ProgresoCarrito {
  const tope = metas.length > 0 ? metas[metas.length - 1].monto : 0
  const total = Math.max(0, subtotal)
  const estados = metas.map((m) => ({
    ...m,
    alcanzada: total >= m.monto,
    falta: Math.max(0, m.monto - total),
    posicion: tope > 0 ? (m.monto / tope) * 100 : 100,
  }))
  return {
    metas: estados,
    porcentaje: tope > 0 ? Math.min(100, (total / tope) * 100) : 0,
    siguiente: estados.find((m) => !m.alcanzada) ?? null,
  }
}
