'use client'

import { useMemo, useState } from 'react'
import { Eye, MessageCircle, PackageOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatARS } from '@/lib/format'
import { storeConfig } from '@/lib/store-config'
import { whatsappLink } from '@/lib/whatsapp'
import { ESTADO_PEDIDO_LABEL, ESTADO_PEDIDO_BADGE, ESTADO_SIGUIENTE, METODO_PAGO_LABEL } from '@/lib/constants'
import type { OrderConItems, EstadoPedido } from '@/types/db'
import { cambiarEstadoPedido, marcarLeido } from '@/app/admin/pedidos/actions'

function fecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function PedidosManager({ pedidos }: { pedidos: OrderConItems[] }) {
  const [items, setItems] = useState<OrderConItems[]>(pedidos)
  const [verCerrados, setVerCerrados] = useState(false)

  const sinLeer = items.filter((p) => !p.leido).length
  const visibles = useMemo(
    () => items.filter((p) => verCerrados || p.estado !== 'cancelado'),
    [items, verCerrados],
  )

  function patch(id: string, cambio: Partial<OrderConItems>) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambio } : p)))
  }

  async function cambiar(id: string, estado: EstadoPedido) {
    const r = await cambiarEstadoPedido(id, estado)
    if (r.ok) {
      patch(id, { estado, leido: true })
      toast.success(`Pedido: ${ESTADO_PEDIDO_LABEL[estado]}`)
    } else {
      toast.error(r.error)
    }
  }

  async function visto(id: string) {
    const r = await marcarLeido(id)
    if (r.ok) patch(id, { leido: true })
    else toast.error(r.error)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        <PackageOpen className="h-8 w-8" />
        <p className="mt-2">Todavía no entró ningún pedido.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {sinLeer > 0 ? (
            <span className="font-medium text-foreground">{sinLeer} sin leer</span>
          ) : (
            'Todo al día'
          )}{' '}
          · {items.length} {items.length === 1 ? 'pedido' : 'pedidos'} en total
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={verCerrados}
            onChange={(e) => setVerCerrados(e.target.checked)}
            className="size-4"
          />
          Mostrar cancelados
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No hay pedidos activos. Activá la opción de arriba para ver los cancelados.
        </p>
      ) : (
        visibles.map((p) => <TarjetaPedido key={p.id} pedido={p} onCambiar={cambiar} onVisto={visto} />)
      )}
    </div>
  )
}

function TarjetaPedido({
  pedido: p,
  onCambiar,
  onVisto,
}: {
  pedido: OrderConItems
  onCambiar: (id: string, estado: EstadoPedido) => void
  onVisto: (id: string) => void
}) {
  const wa = storeConfig.whatsapp
    ? whatsappLink(
        p.cliente_telefono,
        `Hola ${p.cliente_nombre}, te escribimos de ${storeConfig.nombre} por tu pedido ${p.numero_pedido}.`,
      )
    : null

  return (
    <div className={cn('rounded-lg border p-4', !p.leido && 'border-primary/50 bg-primary/5')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{p.numero_pedido}</span>
          <span className={cn('rounded-full border px-2 py-0.5 text-xs', ESTADO_PEDIDO_BADGE[p.estado])}>
            {ESTADO_PEDIDO_LABEL[p.estado]}
          </span>
          {!p.leido && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Nuevo</span>
          )}
        </div>
        <span className="text-sm text-muted-foreground" suppressHydrationWarning>
          {fecha(p.created_at)}
        </span>
      </div>

      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="font-medium">{p.cliente_nombre}</p>
          <p className="text-muted-foreground">
            {p.cliente_telefono}
            {p.cliente_email ? ` · ${p.cliente_email}` : ''}
          </p>
          <p className="mt-1 text-muted-foreground">
            {p.direccion_envio}
            {p.zona_envio ? ` · ${p.zona_envio}` : ''}
          </p>
          <p className="text-muted-foreground">{METODO_PAGO_LABEL[p.metodo_pago]}</p>
        </div>
        <div>
          <ul className="space-y-1">
            {p.order_items.map((it) => (
              <li key={it.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {it.cantidad}× {it.nombre}
                </span>
                <span>{formatARS(it.precio_unitario * it.cantidad)}</span>
              </li>
            ))}
          </ul>
          {p.costo_envio != null && p.costo_envio > 0 && (
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>Envío</span>
              <span>{formatARS(p.costo_envio)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
            <span>Total</span>
            <span>{formatARS(p.total)}</span>
          </div>
        </div>
      </div>

      {p.notas && (
        <p className="mt-2 rounded bg-muted/40 p-2 text-sm">
          <span className="font-medium">Notas:</span> {p.notas}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ESTADO_SIGUIENTE[p.estado].map((e) => (
          <Button
            key={e}
            type="button"
            size="sm"
            variant={e === 'cancelado' ? 'outline' : 'default'}
            onClick={() => onCambiar(p.id, e)}
          >
            {e === 'cancelado' ? 'Cancelar' : `Marcar ${ESTADO_PEDIDO_LABEL[e].toLowerCase()}`}
          </Button>
        ))}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'sm', variant: 'outline' }),
              'border-transparent bg-[#25D366] text-white hover:bg-[#1ebe5b]',
            )}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        )}
        {!p.leido && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onVisto(p.id)}>
            <Eye className="h-4 w-4" />
            Visto
          </Button>
        )}
      </div>
    </div>
  )
}
