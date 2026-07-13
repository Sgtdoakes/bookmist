'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { OutlineButton } from '@/components/public/buttons'
import { ProductCard } from '@/components/public/product-card'
import type { Producto } from '@/types/db'

export function BestSellersScroller({
  eyebrow,
  titulo,
  productos,
  ctaTexto,
  ctaHref,
}: {
  eyebrow: string
  titulo: string
  productos: Producto[]
  ctaTexto?: string
  ctaHref?: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-script mb-1 text-2xl text-muted">{eyebrow}</p>
          <h2 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">{titulo}</h2>
        </div>
        <div className="flex gap-3">
          <OutlineButton onClick={() => scroll(-1)} className="h-10 w-10" aria-label="Anterior">
            <ChevronLeft size={18} />
          </OutlineButton>
          <OutlineButton onClick={() => scroll(1)} className="h-10 w-10" aria-label="Siguiente">
            <ChevronRight size={18} />
          </OutlineButton>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {productos.map((p) => (
          <div key={p.id} className="w-64 flex-shrink-0 md:w-72">
            <ProductCard producto={p} />
          </div>
        ))}
      </div>

      {ctaTexto && ctaHref && (
        <div className="mt-6 flex justify-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {ctaTexto} <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </>
  )
}
