'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatARS } from '@/lib/format'
import type { Producto } from '@/types/db'

type Props = {
  productosDisponibles: Producto[]
  value: string[]
  onChange: (ids: string[]) => void
}

// Picker de productos para la fuente "manual" del bloque de productos —
// buscador + grilla visual, mismo patrón que SelectorItems.
export function SelectorProductos({ productosDisponibles, value, onChange }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return productosDisponibles
    return productosDisponibles.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [productosDisponibles, busqueda])

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id))
    else onChange([...value, id])
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto…"
          className="pl-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {filtrados.map((p) => {
          const elegido = value.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`relative flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors ${
                elegido ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
              }`}
            >
              {elegido && (
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted/30">
                {p.imagen_principal && (
                  <Image src={p.imagen_principal} alt="" fill sizes="64px" className="object-cover" />
                )}
              </div>
              <span className="line-clamp-2 text-xs font-medium">{p.nombre}</span>
              <span className="text-[0.7rem] text-muted-foreground">{formatARS(p.precio)}</span>
            </button>
          )
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} producto{value.length === 1 ? '' : 's'} elegido{value.length === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  )
}
