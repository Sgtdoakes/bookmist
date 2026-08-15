import Link from 'next/link'
import { Pencil } from 'lucide-react'

// Atajo para saltar de la ficha pública al editor del producto sin pasar
// por el panel: Dani encuentra un precio mal puesto navegando el sitio y lo
// corrige desde ahí mismo. Solo se renderiza con sesión de admin (ver
// getIsAdmin en src/lib/admin.ts), así que ningún visitante lo recibe en el
// HTML.
//
// Va apilado justo encima del botón de WhatsApp, que ocupa bottom-6 con 56px
// de alto (whatsapp-button.tsx): bottom-24 = 96px deja 16px de aire entre
// los dos. Mismo z-50 — no se pisan porque no se superponen.
export function BotonEditarProducto({ productoId, nombre }: { productoId: string; nombre: string }) {
  return (
    <Link
      href={`/admin/productos/${productoId}`}
      aria-label={`Editar ${nombre} en el panel`}
      title={`Editar ${nombre}`}
      className="fixed bottom-24 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-xl transition-transform hover:scale-105"
    >
      <Pencil size={20} />
    </Link>
  )
}
