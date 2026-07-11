'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Producto } from '@/types/db'

type Props = {
  itemsDisponibles: Producto[]
  cantidades: Record<string, number>
  onToggle: (id: string, checked: boolean) => void
  onCantidad: (id: string, cantidad: number) => void
}

// Picker de productos para armar el contenido de una caja/kit: buscador +
// grilla de fichas con portada. Desde la fusión de la biblioteca en
// productos (Fase 6h), cualquier producto puede ser el "ingrediente" de
// otro — el propio formulario ya excluye el producto que se está editando.
export function SelectorItems({ itemsDisponibles, cantidades, onToggle, onCantidad }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return itemsDisponibles
    return itemsDisponibles.filter(
      (i) => i.nombre.toLowerCase().includes(q) || i.autor?.toLowerCase().includes(q),
    )
  }, [itemsDisponibles, busqueda])

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o autor…"
          className="pl-8"
        />
      </div>
      {filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {filtrados.map((item) => {
            const elegido = item.id in cantidades
            return (
              <div
                key={item.id}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors ${
                  elegido ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(item.id, !elegido)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted/30">
                    {item.imagen_principal && (
                      <Image src={item.imagen_principal} alt="" fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <span className="line-clamp-2 text-xs font-medium">
                    {item.nombre}
                    {item.autor ? ` — ${item.autor}` : ''}
                  </span>
                </button>
                {elegido && (
                  <Input
                    type="number"
                    min={1}
                    value={cantidades[item.id]}
                    onChange={(e) => onCantidad(item.id, Math.max(1, Number(e.target.value)))}
                    className="h-7 w-14 text-center"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
