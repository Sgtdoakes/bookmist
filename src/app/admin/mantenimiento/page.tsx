import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MantenimientoManager } from '@/components/admin/mantenimiento-manager'

export const metadata = { title: 'Modo reponiendo stock' }

async function getEstado() {
  try {
    const supabase = await createClient()
    const [{ data: config }, { data: productos }] = await Promise.all([
      supabase
        .from('configuracion')
        .select('clave, valor')
        .in('clave', ['mantenimiento_activo', 'mantenimiento_motivo', 'mantenimiento_mensaje']),
      supabase.from('productos').select('stock').eq('activo', true),
    ])
    const map = new Map((config ?? []).map((r) => [r.clave, r.valor]))
    const activos = productos ?? []
    return {
      activo: map.get('mantenimiento_activo') === 'true',
      motivo: map.get('mantenimiento_motivo') ?? null,
      mensaje: map.get('mantenimiento_mensaje') ?? '',
      totalActivos: activos.length,
      conStock: activos.filter((p) => p.stock > 0).length,
    }
  } catch {
    return { activo: false, motivo: null, mensaje: '', totalActivos: 0, conStock: 0 }
  }
}

export default async function AdminMantenimientoPage() {
  const estado = await getEstado()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Modo reponiendo stock</h1>
      <p className="mt-1 text-muted-foreground">
        Cuando está activo, el sitio público muestra una pantalla de &quot;volvemos pronto&quot; en vez del
        catálogo (vos seguís viendo el sitio normal mientras estés con la sesión iniciada). Se
        activa solo cuando ninguna caja/kit visible tiene stock, o cuando lo activás vos a mano.
      </p>

      <div className="mt-6">
        <MantenimientoManager estadoInicial={estado} />
      </div>
    </div>
  )
}
