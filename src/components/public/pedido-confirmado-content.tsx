'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { sendGAEvent } from '@next/third-parties/google'
import { CheckCircle2, Clock, XCircle, MessageCircle, Truck, PackageCheck } from 'lucide-react'
import { PrimaryButton, OutlineButton } from '@/components/public/buttons'
import { formatARS } from '@/lib/format'
import { resolverVistaPedido, esVisitaDeCompra, type VistaPedidoTipo } from '@/lib/pedido-confirmacion'
import { fbTrack, contenidoPixel } from '@/lib/meta-pixel'
import { DatosTransferenciaBox } from '@/components/public/datos-transferencia-box'
import { GoogleCustomerReviews } from '@/components/public/google-customer-reviews'
import { ESTADO_PEDIDO_PUBLICO, andreaniSeguimientoUrl } from '@/lib/constants'
import type { CuentaPago } from '@/lib/configuracion'
import type { PedidoPublico } from '@/lib/pedidos'
import type { EstadoPedido, MetodoPago } from '@/types/db'

type LastOrder = {
  numero: string
  whatsapp_url: string | null
  total: number
  metodo_pago?: MetodoPago
  items: { nombre: string; cantidad: number; precio: number }[]
  // Fase 8h (Google Customer Reviews) — ausentes en pedidos guardados antes
  // de este cambio (sessionStorage viejo todavía en el navegador), por eso
  // son opcionales.
  email?: string
  estimatedDeliveryDate?: string
}

type Estado = { loaded: boolean; order: LastOrder | null }

const ICONO_POR_TIPO: Record<VistaPedidoTipo, React.ReactNode> = {
  rechazado: <XCircle className="mx-auto h-14 w-14 text-red-400" />,
  pendiente: <Clock className="mx-auto h-14 w-14 text-amber-400" />,
  aprobado: <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />,
  generico: <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />,
}

const ICONO_POR_ESTADO: Record<EstadoPedido, React.ReactNode> = {
  pendiente: <Clock className="mx-auto h-14 w-14 text-amber-400" />,
  pagado: <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />,
  enviado: <Truck className="mx-auto h-14 w-14 text-sky-400" />,
  entregado: <PackageCheck className="mx-auto h-14 w-14 text-indigo-400" />,
  cancelado: <XCircle className="mx-auto h-14 w-14 text-red-400" />,
}

// Los cuatro pasos que recorre un pedido que termina bien. 'cancelado' no
// está: no es un paso del camino, es salirse de él — por eso la línea de
// progreso no se dibuja para un pedido cancelado.
const PASOS: EstadoPedido[] = ['pendiente', 'pagado', 'enviado', 'entregado']

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

function LineaDeProgreso({ estado }: { estado: EstadoPedido }) {
  const actual = PASOS.indexOf(estado)
  if (actual < 0) return null

  return (
    <ol className="mt-6 flex items-center gap-1" aria-label="Progreso del pedido">
      {PASOS.map((paso, i) => {
        const alcanzado = i <= actual
        return (
          <li key={paso} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center gap-1">
              <span
                className={`h-1 flex-1 rounded-full ${i === 0 ? 'opacity-0' : alcanzado ? 'bg-primary' : 'bg-foreground/12'}`}
              />
              <span
                className={`size-2.5 shrink-0 rounded-full ${alcanzado ? 'bg-primary' : 'bg-foreground/20'}`}
              />
              <span
                className={`h-1 flex-1 rounded-full ${
                  i === PASOS.length - 1 ? 'opacity-0' : i < actual ? 'bg-primary' : 'bg-foreground/12'
                }`}
              />
            </div>
            <span
              className={`text-center text-[11px] leading-tight ${
                alcanzado ? 'font-semibold text-foreground' : 'text-foreground/45'
              }`}
            >
              {ESTADO_PEDIDO_PUBLICO[paso].titulo}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function PedidoConfirmadoContent({
  numero,
  pedido,
  cuentasPago,
  gaCompraDesdeServidor,
}: {
  numero: string
  // Viene del servidor cuando la URL trae un token válido. null = no sabemos
  // nada del pedido y mostramos lo que haya guardado el navegador.
  pedido: PedidoPublico | null
  cuentasPago: CuentaPago[]
  // Si el servidor está configurado para contar las ventas de Mercado Pago
  // por su cuenta. Decide si esta página tiene que mandar el evento de GA4 o
  // callarse para no contarla dos veces.
  gaCompraDesdeServidor: boolean
}) {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
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

  // "Recién comprado" = este mismo navegador acaba de crear el pedido. Es lo
  // que distingue la visita de celebración de la de alguien que vuelve días
  // después desde el link del mail, y lo que decide si corresponde disparar
  // el evento de compra y el opt-in de reseñas.
  const recienComprado = state.order !== null

  const vistaCompra = resolverVistaPedido(status)
  const vistaEstado = pedido ? ESTADO_PEDIDO_PUBLICO[pedido.estado] : null

  // Eventos de compra para GA4 y para el píxel de Meta. Cuándo una visita a
  // esta página cuenta como venta lo decide `esVisitaDeCompra` — ahí está
  // explicado por qué mirar solo el sessionStorage dejaba afuera todas las
  // compras por Mercado Pago.
  //
  // Los números salen del pedido real cuando lo tenemos (la URL de vuelta de
  // Mercado Pago trae el token, así que casi siempre lo tenemos) y del
  // sessionStorage si no. Antes solo existía el segundo camino, y ese es
  // justo el que se pierde al volver de la pasarela en otra pestaña.
  useEffect(() => {
    if (!state.loaded || !esVisitaDeCompra(status, recienComprado)) return
    const compra = pedido
      ? {
          numero: pedido.numero_pedido,
          total: pedido.total,
          metodoPago: pedido.metodo_pago,
          items: pedido.items.map((i) => ({
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio: i.precio_unitario,
          })),
        }
      : state.order
        ? { ...state.order, metodoPago: state.order.metodo_pago }
        : null
    if (!compra) return

    // Las marcas de "esta venta ya se registró" van en localStorage y no en
    // sessionStorage: tienen que sobrevivir al cierre de la pestaña, que es
    // exactamente lo que pasa al pagar con Mercado Pago desde el celular.
    // Una por sistema, porque no siempre se manda a los dos.
    const yaRegistrado = (marca: string) => {
      try {
        if (localStorage.getItem(marca)) return true
        localStorage.setItem(marca, '1')
      } catch {
        // sin localStorage: se manda igual, puede duplicarse en un refresh.
      }
      return false
    }

    // Con Mercado Pago la venta la cuenta el servidor cuando el webhook
    // confirma el pago (src/lib/ga-servidor.ts): así también entran las de
    // quien pagó y nunca volvió al sitio. Mandarla también desde acá la
    // contaría dos veces. Si la medición del servidor está apagada (falta
    // GA4_API_SECRET), este camino sigue siendo el único que hay y se manda
    // igual — apagar Analytics del servidor no puede dejar a Dani sin datos.
    const laCuentaElServidor = gaCompraDesdeServidor && compra.metodoPago === 'mercadopago'
    if (!laCuentaElServidor && !yaRegistrado(`bookmist-ga-purchase-${compra.numero}`)) {
      sendGAEvent('event', 'purchase', {
        transaction_id: compra.numero,
        value: compra.total,
        currency: 'ARS',
        items: compra.items.map((i) => ({
          item_name: i.nombre,
          price: i.precio,
          quantity: i.cantidad,
        })),
      })
    }

    // El píxel de Meta no tiene equivalente del lado del servidor (eso sería
    // la Conversions API, que todavía no está), así que acá se manda siempre,
    // también para Mercado Pago.
    if (!yaRegistrado(`bookmist-fb-purchase-${compra.numero}`)) {
      fbTrack('Purchase', {
        value: compra.total,
        currency: 'ARS',
        ...contenidoPixel(compra.items),
      })
    }
  }, [state.loaded, state.order, pedido, status, recienComprado, gaCompraDesdeServidor])

  if (!state.loaded) {
    return <div className="mx-auto max-w-xl px-6 py-16" />
  }

  const { order } = state
  const merchantId = process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_ID

  // Qué encabezado mostrar, todo o nada para que título, mensaje e ícono
  // cuenten siempre lo mismo. Vuelve de Mercado Pago (`status`), o acaba de
  // comprar, o no tenemos el pedido: gana la vista de compra. Entra desde el
  // mail días después: gana el estado real.
  const usarVistaCompra = !!status || recienComprado || !pedido
  const titulo = usarVistaCompra ? vistaCompra.titulo : vistaEstado!.titulo
  const mensaje = usarVistaCompra ? vistaCompra.mensaje : vistaEstado!.detalle
  const icono = usarVistaCompra ? ICONO_POR_TIPO[vistaCompra.tipo] : ICONO_POR_ESTADO[pedido!.estado]

  // El resumen sale del pedido real si lo tenemos; si no, de lo que guardó el
  // navegador. Se normaliza a una sola forma para no duplicar el JSX.
  const items =
    pedido?.items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio_unitario })) ??
    order?.items ??
    null
  const total = pedido?.total ?? order?.total ?? null
  const metodoPago = pedido?.metodo_pago ?? order?.metodo_pago
  const pagaTransfiriendo = metodoPago === 'transferencia' || metodoPago === 'deposito'
  // Los datos para transferir solo importan mientras haya algo que pagar.
  const faltaPagar = pedido ? pedido.estado === 'pendiente' : vistaCompra.tipo !== 'rechazado'

  return (
    <div className="mx-auto max-w-xl px-6 py-12 text-center">
      {icono}
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">{titulo}</h1>
      <p className="mt-2 text-foreground/75">
        Pedido <strong className="text-foreground">{numero}</strong>. {mensaje}
      </p>

      {pedido && pedido.estado !== 'cancelado' && (
        <div className="mt-6 rounded-2xl border border-foreground/12 p-4">
          <LineaDeProgreso estado={pedido.estado} />
          <p className="mt-4 text-sm text-foreground/60">
            Última actualización: {fechaCorta(pedido.estado_actualizado_at)}
          </p>
        </div>
      )}

      {pedido?.seguimiento && (
        <div className="mt-4 rounded-2xl border border-foreground/12 p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/50">
            Seguimiento Andreani
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-foreground">
            {pedido.seguimiento}
          </p>
          <a
            href={andreaniSeguimientoUrl(pedido.seguimiento)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-primary underline underline-offset-4"
          >
            Rastrear en andreani.com
          </a>
        </div>
      )}

      {items && total != null && (
        <div className="mt-4 rounded-2xl border border-foreground/12 p-4 text-left">
          <h2 className="font-semibold text-foreground">Resumen</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-2">
                <span className="text-foreground/70">
                  {i.cantidad}× {i.nombre}
                </span>
                <span className="text-foreground">{formatARS(i.precio * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          {pedido && pedido.descuento > 0 && (
            <div className="mt-1 flex justify-between text-sm text-foreground/70">
              <span>Descuento{pedido.cupon_codigo ? ` (cupón ${pedido.cupon_codigo})` : ''}</span>
              <span>−{formatARS(pedido.descuento)}</span>
            </div>
          )}
          {pedido?.costo_envio != null && (
            <div className="mt-1 flex justify-between text-sm text-foreground/70">
              <span>Envío</span>
              <span>{pedido.costo_envio === 0 ? 'Gratis' : formatARS(pedido.costo_envio)}</span>
            </div>
          )}
          <div className="my-3 h-px bg-foreground/12" />
          <div className="flex justify-between font-semibold text-foreground">
            <span>Total</span>
            <span>{formatARS(total)}</span>
          </div>
          {pedido && (
            <p className="mt-3 text-sm text-foreground/60">
              Entrega en {pedido.direccion_envio}
            </p>
          )}
        </div>
      )}

      {pagaTransfiriendo && faltaPagar && cuentasPago.length > 0 && (
        <DatosTransferenciaBox cuentas={cuentasPago} />
      )}

      {order?.whatsapp_url && vistaCompra.tipo !== 'rechazado' && (
        <a href={order.whatsapp_url} target="_blank" rel="noopener noreferrer" className="mt-6 block">
          <PrimaryButton className="w-full justify-center bg-[#25D366] text-white hover:bg-[#1ebe5b]">
            <MessageCircle size={18} />
            Avisarnos por WhatsApp
          </PrimaryButton>
        </a>
      )}

      {order?.email && order.estimatedDeliveryDate && merchantId && vistaCompra.tipo !== 'rechazado' && (
        <GoogleCustomerReviews
          merchantId={merchantId}
          orderId={order.numero}
          email={order.email}
          estimatedDeliveryDate={order.estimatedDeliveryDate}
        />
      )}

      <p className="mt-3 text-sm text-foreground/60">
        {pedido
          ? 'Guardá el mail de confirmación: desde ahí podés volver a esta página cuando quieras.'
          : 'Guardá el número de tu pedido por las dudas.'}
      </p>

      <Link href="/productos" className="mt-6 inline-block">
        <OutlineButton className="px-6 py-3">Seguir comprando</OutlineButton>
      </Link>
    </div>
  )
}
