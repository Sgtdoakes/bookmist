'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Producto } from '@/types/db'

type Props = {
  candidatas: Producto[]
  elegidos: string[]
  onToggle: (id: string, checked: boolean) => void
}

// Picker de variantes: mismo patrón visual que SelectorItems (buscador +
// grilla con portada), pero sin cantidad — acá solo importa "es variante de
// este producto sí/no". `candidatas` es todo el catálogo menos el producto
// que se está editando (getProductosParaVariantes()).
export function SelectorVariantes({ candidatas, elegidos, onToggle }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return candidatas
    return candidatas.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [candidatas, busqueda])

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          className="pl-8"
        />
      </div>
      {filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {filtradas.map((p) => {
            const elegido = elegidos.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggle(p.id, !elegido)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors ${
                  elegido ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted/30">
                  {p.imagen_principal && (
                    <Image src={p.imagen_principal} alt="" fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <span className="line-clamp-2 text-xs font-medium">
                  {p.nombre}
                  {p.variante_etiqueta ? ` — ${p.variante_etiqueta}` : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
