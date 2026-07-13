import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MantenimientoManager } from '@/components/admin/mantenimiento-manager'
import type { Entorno } from '@/lib/mantenimiento'

export const metadata = { title: 'Modo reponiendo stock' }

async function getEstado(entorno: Entorno) {
  const sufijo = entorno === 'pruebas' ? '_pruebas' : ''
  try {
    const supabase = await createClient()
    const [{ data: config }, { data: productos }] = await Promise.all([
      supabase
        .from('configuracion')
        .select('clave, valor')
        .in('clave', [`mantenimiento_activo${sufijo}`, `mantenimiento_motivo${sufijo}`, `mantenimiento_mensaje${sufijo}`]),
      supabase.from('productos').select('stock').eq('activo', true),
    ])
    const map = new Map((config ?? []).map((r) => [r.clave, r.valor]))
    const activos = productos ?? []
    return {
      activo: map.get(`mantenimiento_activo${sufijo}`) === 'true',
      motivo: map.get(`mantenimiento_motivo${sufijo}`) ?? null,
      mensaje: map.get(`mantenimiento_mensaje${sufijo}`) ?? '',
      totalActivos: activos.length,
      conStock: activos.filter((p) => p.stock > 0).length,
    }
  } catch {
    return { activo: false, motivo: null, mensaje: '', totalActivos: 0, conStock: 0 }
  }
}

export default async function AdminMantenimientoPage() {
  const [produccion, pruebas] = await Promise.all([getEstado('produccion'), getEstado('pruebas')])

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
        catálogo (vos seguís viendo el sitio normal mientras estés con la sesión iniciada). Son dos
        interruptores independientes: uno para tu dominio real y otro para bookmist.vercel.app —
        activar uno no toca al otro.
      </p>

      <div className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">Sitio de producción</h2>
        <p className="text-sm text-muted-foreground">
          Tu dominio real. Se activa solo cuando ninguna caja/kit visible tiene stock, o cuando lo
          activás vos a mano.
        </p>
        <div className="mt-2">
          <MantenimientoManager entorno="produccion" estadoInicial={produccion} />
        </div>
      </div>

      <div className="mt-10 space-y-2 border-t pt-8">
        <h2 className="text-lg font-semibold">Entorno de pruebas (bookmist.vercel.app)</h2>
        <p className="text-sm text-muted-foreground">
          Para cuando probás flujos ahí sin afectar el sitio real. Solo manual, nunca se activa
          solo por falta de stock.
        </p>
        <div className="mt-2">
          <MantenimientoManager entorno="pruebas" estadoInicial={pruebas} mostrarStock={false} />
        </div>
      </div>
    </div>
  )
}
