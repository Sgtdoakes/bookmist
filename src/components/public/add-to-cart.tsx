'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { PrimaryButton } from '@/components/public/buttons'
import { useCart } from '@/lib/cart'
import type { Producto } from '@/types/db'

export function AddToCart({
  producto,
  showQuantity = false,
  className = '',
}: {
  producto: Pick<Producto, 'id' | 'nombre' | 'precio' | 'imagen_principal' | 'stock'>
  showQuantity?: boolean
  className?: string
}) {
  const { add } = useCart()
  const [cantidad, setCantidad] = useState(1)
  const sinStock = producto.stock <= 0

  function handleAdd() {
    add(
      {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen_principal,
        stock: producto.stock,
      },
      cantidad,
    )
    toast.success('Agregado al carrito', { description: producto.nombre })
  }

  if (sinStock) {
    return (
      <PrimaryButton disabled className={`w-full cursor-not-allowed justify-center opacity-50 ${className}`}>
        Sin stock
      </PrimaryButton>
    )
  }

  if (!showQuantity) {
    return (
      <PrimaryButton onClick={handleAdd} className={`w-full justify-center ${className}`}>
        <ShoppingBag size={16} /> Agregar
      </PrimaryButton>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-foreground/16">
          <button
            type="button"
            aria-label="Restar"
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            disabled={cantidad <= 1}
            className="flex h-9 w-9 items-center justify-center text-foreground disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums text-foreground">{cantidad}</span>
          <button
            type="button"
            aria-label="Sumar"
            onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
            disabled={cantidad >= producto.stock}
            className="flex h-9 w-9 items-center justify-center text-foreground disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
        <PrimaryButton onClick={handleAdd} className="flex-1 justify-center">
          <ShoppingBag size={16} /> Agregar al carrito
        </PrimaryButton>
      </div>
    </div>
  )
}
