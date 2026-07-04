'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  producto_id: string
  nombre: string
  precio: number
  imagen: string | null
  stock: number
  cantidad: number
}

type CartContextValue = {
  items: CartItem[]
  /** ya se leyó el carrito desde localStorage (evita parpadeos en SSR) */
  ready: boolean
  add: (item: Omit<CartItem, 'cantidad'>, cantidad?: number) => void
  remove: (productoId: string) => void
  setCantidad: (productoId: string, cantidad: number) => void
  clear: () => void
  totalItems: number
  totalPrecio: number
}

const STORAGE_KEY = 'bookmist-cart-v1'

const CartContext = createContext<CartContextValue | null>(null)

function clamp(cantidad: number, stock: number) {
  const max = stock > 0 ? stock : 0
  return Math.max(1, Math.min(cantidad, max || 1))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  // Cargar desde localStorage al montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      // ignorar JSON inválido
    }
    setReady(true)
  }, [])

  // Guardar ante cada cambio (una vez listo).
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // almacenamiento lleno o bloqueado: no es crítico
    }
  }, [items, ready])

  const add = useCallback((item: Omit<CartItem, 'cantidad'>, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto_id === item.producto_id)
      if (existente) {
        return prev.map((i) =>
          i.producto_id === item.producto_id
            ? { ...i, ...item, cantidad: clamp(i.cantidad + cantidad, item.stock) }
            : i,
        )
      }
      return [...prev, { ...item, cantidad: clamp(cantidad, item.stock) }]
    })
  }, [])

  const remove = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.producto_id !== productoId))
  }, [])

  const setCantidad = useCallback((productoId: string, cantidad: number) => {
    setItems((prev) =>
      prev.map((i) => (i.producto_id === productoId ? { ...i, cantidad: clamp(cantidad, i.stock) } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const totalItems = useMemo(() => items.reduce((acc, i) => acc + i.cantidad, 0), [items])
  const totalPrecio = useMemo(() => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [items])

  const value: CartContextValue = {
    items,
    ready,
    add,
    remove,
    setCantidad,
    clear,
    totalItems,
    totalPrecio,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
