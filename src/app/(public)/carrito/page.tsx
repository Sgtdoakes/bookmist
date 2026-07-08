'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { OutlineButton, PrimaryButton } from '@/components/public/buttons'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { useCart } from '@/lib/cart'
import { formatARS } from '@/lib/format'

export default function CarritoPage() {
  const { items, ready, setCantidad, remove, clear, totalItems, totalPrecio } = useCart()

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-6 py-16" />
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Tu carrito está vacío</h1>
        <p className="mt-2 text-foreground/75">Encontrá tu próxima caja o kit en nuestro catálogo.</p>
        <Link href="/productos" className="mt-6 inline-block">
          <PrimaryButton>Ver catálogo</PrimaryButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold text-foreground">Tu carrito</h1>
      <p className="mt-1 text-foreground/75">
        {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
      </p>

      <ul className="mt-6 divide-y divide-foreground/10 rounded-2xl border border-foreground/10">
        {items.map((item) => (
          <li key={item.producto_id} className="flex gap-4 p-4">
            <div className="relative w-16 shrink-0 overflow-hidden rounded-lg">
              {item.imagen ? (
                <Image src={item.imagen} alt={item.nombre} fill sizes="64px" className="object-cover" />
              ) : (
                <ImgPlaceholder label="" className="aspect-square w-full" iconSize={16} />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-medium text-foreground">{item.nombre}</p>
              <p className="mt-1 text-sm text-foreground/70">{formatARS(item.precio)} c/u</p>

              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-full border border-foreground/16">
                  <button
                    type="button"
                    aria-label="Restar"
                    onClick={() => setCantidad(item.producto_id, item.cantidad - 1)}
                    disabled={item.cantidad <= 1}
                    className="flex h-8 w-8 items-center justify-center text-foreground disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums text-foreground">{item.cantidad}</span>
                  <button
                    type="button"
                    aria-label="Sumar"
                    onClick={() => setCantidad(item.producto_id, item.cantidad + 1)}
                    disabled={item.cantidad >= item.stock}
                    className="flex h-8 w-8 items-center justify-center text-foreground disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    {formatARS(item.precio * item.cantidad)}
                  </span>
                  <button
                    type="button"
                    aria-label="Quitar del carrito"
                    onClick={() => remove(item.producto_id)}
                    className="text-foreground/60 hover:text-foreground"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={clear} className="text-sm text-foreground/70 hover:text-foreground">
          Vaciar carrito
        </button>
        <div className="text-right">
          <p className="text-sm text-foreground/70">Total</p>
          <p className="font-heading text-2xl font-semibold text-foreground">{formatARS(totalPrecio)}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link href="/productos">
          <OutlineButton className="w-full px-6 py-3 sm:w-auto">Seguir comprando</OutlineButton>
        </Link>
        <Link href="/checkout">
          <PrimaryButton className="w-full px-7 py-3 sm:w-auto">Ir a pagar</PrimaryButton>
        </Link>
      </div>
    </div>
  )
}
