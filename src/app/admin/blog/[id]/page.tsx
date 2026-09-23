import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { NotaForm } from '@/components/admin/nota-form'
import { getNotaAdmin, getProductosParaNota } from '../datos'

export const metadata = { title: 'Editar nota' }

type Props = { params: Promise<{ id: string }> }

export default async function EditarNotaPage({ params }: Props) {
  const { id } = await params
  const [nota, productos] = await Promise.all([getNotaAdmin(id), getProductosParaNota()])
  if (!nota) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al blog
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Editar nota</h1>
      {/* key: al guardar una nota nueva la página pasa de /nueva a /<id>, y
          el formulario tiene que arrancar de la fila guardada, no del estado
          del alta. */}
      <NotaForm key={nota.updated_at} nota={nota} productosDisponibles={productos} />
    </div>
  )
}
