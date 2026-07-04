'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart'

export function CartButton() {
  const { totalItems, ready } = useCart()

  return (
    <Link
      href="/carrito"
      aria-label="Ver carrito"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-foreground/45 text-foreground transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background"
    >
      <ShoppingCart size={18} />
      {ready && totalItems > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
          {totalItems}
        </span>
      )}
    </Link>
  )
}
