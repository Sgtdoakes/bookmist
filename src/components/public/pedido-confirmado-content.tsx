'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, XCircle, MessageCircle } from 'lucide-react'
import { PrimaryButton, OutlineButton } from '@/components/public/buttons'
import { formatARS } from '@/lib/format'
import { resolverVistaPedido, type VistaPedidoTipo } from '@/lib/pedido-confirmacion'
import { DatosTransferenciaBox } from '@/components/public/datos-transferencia-box'
import type { CuentaPago } from '@/lib/configuracion'
import type { MetodoPago } from '@/types/db'

type LastOrder = {
  numero: string
  whatsapp_url: string | null
  total: number
  metodo_pago?: MetodoPago
  items: { nombre: string; cantidad: number; precio: number }[]
}

type Estado = { loaded: boolean; order: LastOrder | null }

const ICONO_POR_TIPO: Record<VistaPedidoTipo, React.ReactNode> = {
  rechazado: <XCircle className="mx-auto h-14 w-14 text-red-400" />,
  pendiente: <Clock className="mx-auto h-14 w-14 text-amber-400" />,
  aprobado: <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />,
  generico: <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />,
}

export function PedidoConfirmadoContent({
  numero,
  cuentasPago,
}: {
  numero: string
  cuentasPago: CuentaPago[]
}) {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const vista = resolverVistaPedido(status)
  const [state, setState] = useState<Estado>({ loaded: false, order: null })

  useEffect(() => {
    let order: LastOrder | null = null
    try {
      const raw = sessionStorage.getItem('bookmist-last-order')
      if (raw) {
        const parsed = JSON.parse(raw) as LastOrder
        if (parsed.numero === numero) order = parsed
      }
    } catch {
      // sin sessionStorage: confirmación genérica
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ loaded: true, order })
  }, [numero])

  if (!state.loaded) {
    return <div className="mx-auto max-w-xl px-6 py-16" />
  }

  const { order } = state

  return (
    <div className="mx-auto max-w-xl px-6 py-12 text-center">
      {ICONO_POR_TIPO[vista.tipo]}
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">{vista.titulo}</h1>
      <p className="mt-2 text-foreground/75">
        Pedido <strong className="text-foreground">{numero}</strong>. {vista.mensaje}
      </p>

      {order && (
        <div className="mt-6 rounded-2xl border border-foreground/12 p-4 text-left">
          <h2 className="font-semibold text-foreground">Resumen</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-2">
                <span className="text-foreground/70">
                  {i.cantidad}× {i.nombre}
                </span>
                <span className="text-foreground">{formatARS(i.precio * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="my-3 h-px bg-foreground/12" />
          <div className="flex justify-between font-semibold text-foreground">
            <span>Total</span>
            <span>{formatARS(order.total)}</span>
          </div>
        </div>
      )}

      {order && order.metodo_pago === 'transferencia' && cuentasPago.length > 0 && vista.tipo !== 'rechazado' && (
        <DatosTransferenciaBox cuentas={cuentasPago} />
      )}

      {order?.whatsapp_url && vista.tipo !== 'rechazado' && (
        <a href={order.whatsapp_url} target="_blank" rel="noopener noreferrer" className="mt-6 block">
          <PrimaryButton className="w-full justify-center bg-[#25D366] text-white hover:bg-[#1ebe5b]">
            <MessageCircle size={18} />
            Avisarnos por WhatsApp
          </PrimaryButton>
        </a>
      )}

      <p className="mt-3 text-sm text-foreground/60">Guardá el número de tu pedido por las dudas.</p>

      <Link href="/productos" className="mt-6 inline-block">
        <OutlineButton className="px-6 py-3">Seguir comprando</OutlineButton>
      </Link>
    </div>
  )
}
