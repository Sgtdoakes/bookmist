import type { Metadata } from 'next'
import { SeccionesDePagina } from '@/components/public/secciones-renderer'

// ISR: sin esto, el catálogo queda estático desde el build y un producto
// nuevo/editado en Supabase no aparecería hasta el próximo deploy.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Todas las cajas y kits literarios de Bookmist.',
}

// Página 100% bloques: el título/grilla del catálogo ya no está hardcodeado
// acá — es un bloque "Productos" (fuente "todos") como cualquier otro,
// editable/removible/reordenable desde /admin/pagina igual que el resto.
export default function ProductosPage() {
  return <SeccionesDePagina pagina="productos" />
}
