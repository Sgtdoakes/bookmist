// Envío de eventos al píxel de Meta desde cualquier componente cliente.
//
// `fbq` lo define el snippet que monta <MetaPixel> (componente homónimo en
// components/public). Puede no existir por varios motivos normales: el píxel
// está apagado porque falta NEXT_PUBLIC_META_PIXEL_ID, quien navega es Dani
// logueada como admin, o el visitante tiene un bloqueador. En todos esos
// casos esto es un no-op: ningún evento de medición puede romper una compra.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function fbTrack(evento: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', evento, params)
}

// Los eventos estándar de Meta esperan estos nombres exactos (`content_ids`,
// `value`, `currency`...): son los que el administrador de anuncios entiende
// para optimizar campañas y armar públicos. Un nombre propio se registra pero
// no sirve para nada de eso.
export type ItemPixel = { producto_id?: string; nombre: string; cantidad: number; precio: number }

export function contenidoPixel(items: ItemPixel[]) {
  return {
    content_type: 'product',
    content_ids: items.map((i) => i.producto_id ?? i.nombre),
    contents: items.map((i) => ({
      id: i.producto_id ?? i.nombre,
      quantity: i.cantidad,
      item_price: i.precio,
    })),
  }
}
