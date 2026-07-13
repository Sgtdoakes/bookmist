'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PrimaryButton } from '@/components/public/buttons'
import { useCart } from '@/lib/cart'
import { formatARS } from '@/lib/format'
import { checkoutFormSchema, type CheckoutFormInput } from '@/lib/validations'
import { METODO_PAGO_LABEL } from '@/lib/constants'
import { DatosTransferenciaBox } from '@/components/public/datos-transferencia-box'
import type { CuentaPago } from '@/lib/configuracion'
import type { MetodoPago, ZonaEnvio } from '@/types/db'

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-sm text-red-300">{msg}</p>
}

function NotaMetodoPago({ metodo, cuentasPago }: { metodo: MetodoPago; cuentasPago: CuentaPago[] }) {
  if (metodo === 'transferencia' && cuentasPago.length > 0) {
    return <DatosTransferenciaBox cuentas={cuentasPago} />
  }
  if (metodo === 'mercadopago') {
    return (
      <p className="mt-2 text-xs text-foreground/60">
        Al confirmar te llevamos a Mercado Pago para pagar ahora mismo: tarjeta en cuotas, dinero en cuenta o QR.
      </p>
    )
  }
  return null
}

type EstadoCotizacion =
  | { estado: 'sin_cotizar' }
  | { estado: 'cotizando' }
  | { estado: 'ok'; cp: string; costo: number }
  | { estado: 'error'; mensaje: string }

export function CheckoutForm({
  zonas,
  mpEnabled,
  envioCotizado,
  descuentoTransferenciaPct,
  cuentasPago,
}: {
  zonas: ZonaEnvio[]
  mpEnabled: boolean
  // true = Andreani configurado: el envío se cotiza en vivo por CP.
  // false = respaldo: selector de zonas manuales.
  envioCotizado: boolean
  descuentoTransferenciaPct: number
  cuentasPago: CuentaPago[]
}) {
  const router = useRouter()
  const { items, ready, totalPrecio, clear } = useCart()
  const [enviando, setEnviando] = useState(false)
  const [cotizacion, setCotizacion] = useState<EstadoCotizacion>({ estado: 'sin_cotizar' })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      cliente_nombre: '',
      cliente_email: '',
      cliente_telefono: '',
      direccion_envio: '',
      zona_id: null,
      cp_envio: null,
      metodo_pago: mpEnabled ? 'mercadopago' : 'transferencia',
      notas: '',
    },
  })

  // watch() no se puede memoizar con React Compiler (esperado en react-hook-form).
  // eslint-disable-next-line react-hooks/incompatible-library
  const { metodo_pago: metodoPago, zona_id: zonaId, cp_envio: cpEnvio } = watch()

  // Cotización en vivo: cuando el CP tiene 4 dígitos, se cotiza con debounce
  // (y se re-cotiza si cambia el carrito). El precio mostrado es informativo:
  // el servidor vuelve a cotizar al confirmar.
  const itemsKey = items.map((i) => `${i.producto_id}:${i.cantidad}`).join(',')
  const cotizacionSeq = useRef(0)
  useEffect(() => {
    if (!envioCotizado) return
    const cp = (cpEnvio ?? '').trim()
    if (!/^\d{4}$/.test(cp) || items.length === 0) {
      setCotizacion({ estado: 'sin_cotizar' })
      return
    }
    const seq = ++cotizacionSeq.current
    setCotizacion({ estado: 'cotizando' })
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/envio/cotizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cp,
            items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
          }),
        })
        const json = await res.json()
        if (seq !== cotizacionSeq.current) return // llegó tarde: ya hay otra cotización en curso
        if (res.ok && json.ok) setCotizacion({ estado: 'ok', cp: json.cp, costo: json.costo })
        else setCotizacion({ estado: 'error', mensaje: json.error ?? 'No pudimos cotizar el envío.' })
      } catch {
        if (seq === cotizacionSeq.current)
          setCotizacion({ estado: 'error', mensaje: 'Problema de conexión al cotizar. Probá de nuevo.' })
      }
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpEnvio, itemsKey, envioCotizado, items.length])

  const zonaElegida = zonas.find((z) => z.id === zonaId)
  const costoEnvio = envioCotizado
    ? cotizacion.estado === 'ok'
      ? cotizacion.costo
      : null
    : zonaElegida
      ? Number(zonaElegida.costo)
      : null
  const descuento =
    metodoPago === 'transferencia' && descuentoTransferenciaPct > 0
      ? Math.round(totalPrecio * (descuentoTransferenciaPct / 100))
      : 0
  const total = totalPrecio - descuento + (costoEnvio ?? 0)

  if (ready && items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/20 p-10 text-center text-foreground/70">
        <p>Tu carrito está vacío.</p>
        <Link href="/productos" className="mt-4 inline-block">
          <PrimaryButton>Ver catálogo</PrimaryButton>
        </Link>
      </div>
    )
  }

  async function onSubmit(values: CheckoutFormInput) {
    // Con envío cotizado, no se confirma hasta tener una cotización válida
    // del CP actual (el server igual re-cotiza — esto es solo UX).
    if (envioCotizado && cotizacion.estado !== 'ok') {
      toast.error('Ingresá tu código postal para cotizar el envío.')
      return
    }
    setEnviando(true)
    try {
      const payload = {
        ...values,
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? 'No pudimos procesar el pedido.')
        return
      }
      try {
        sessionStorage.setItem(
          'bookmist-last-order',
          JSON.stringify({
            numero: json.numero_pedido,
            whatsapp_url: json.whatsapp_url,
            total: json.total,
            metodo_pago: values.metodo_pago,
            items: items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
          }),
        )
      } catch {
        // sessionStorage no disponible: la confirmación mostrará la versión genérica
      }
      clear()
      // Mercado Pago: redirigimos a la pasarela de pago.
      if (json.mp_init_point) {
        window.location.href = json.mp_init_point
        return
      }
      router.push(`/pedido/${json.numero_pedido}`)
    } catch {
      toast.error('Hubo un problema de conexión. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Tus datos</h2>
          <div>
            <Label htmlFor="cliente_nombre">Nombre y apellido</Label>
            <Input id="cliente_nombre" {...register('cliente_nombre')} className="mt-1" />
            <FieldError msg={errors.cliente_nombre?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cliente_email">Email</Label>
              <Input id="cliente_email" type="email" {...register('cliente_email')} className="mt-1" />
              <FieldError msg={errors.cliente_email?.message} />
            </div>
            <div>
              <Label htmlFor="cliente_telefono">Teléfono</Label>
              <Input id="cliente_telefono" type="tel" {...register('cliente_telefono')} className="mt-1" />
              <FieldError msg={errors.cliente_telefono?.message} />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Envío</h2>

          {envioCotizado ? (
            <div>
              <Label htmlFor="cp_envio">Código postal</Label>
              <Input
                id="cp_envio"
                inputMode="numeric"
                maxLength={4}
                placeholder="Ej: 1425"
                {...register('cp_envio')}
                className="mt-1 w-40"
              />
              <FieldError msg={errors.cp_envio?.message} />
              {cotizacion.estado === 'cotizando' && (
                <p className="mt-1 text-sm text-foreground/60">Cotizando envío…</p>
              )}
              {cotizacion.estado === 'ok' && (
                <p className="mt-1 text-sm text-foreground">
                  Envío a domicilio por Andreani: <strong>{formatARS(cotizacion.costo)}</strong>
                </p>
              )}
              {cotizacion.estado === 'error' && (
                <p className="mt-1 text-sm text-red-300">{cotizacion.mensaje}</p>
              )}
            </div>
          ) : (
            <>
              <Label htmlFor="zona_id">Zona de envío</Label>
              <select
                id="zona_id"
                {...register('zona_id')}
                className="mt-1 h-9 w-full rounded-lg border border-foreground/16 bg-background px-3 text-sm text-foreground"
              >
                <option value="">Elegí tu zona…</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre} — {formatARS(z.costo)}
                  </option>
                ))}
              </select>
              {zonas.length === 0 && (
                <p className="text-xs text-foreground/60">
                  Todavía no hay zonas de envío cargadas. Escribinos y coordinamos el costo a mano.
                </p>
              )}
              <FieldError msg={errors.zona_id?.message} />
            </>
          )}

          <div className="pt-2">
            <Label htmlFor="direccion_envio">Dirección completa</Label>
            <Textarea
              id="direccion_envio"
              {...register('direccion_envio')}
              placeholder="Calle, número, localidad, provincia…"
              className="mt-1"
            />
            <FieldError msg={errors.direccion_envio?.message} />
          </div>
          <p className="text-xs text-foreground/60">Enviamos a todo el país con Andreani.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">¿Cómo querés pagar?</h2>
          <div className="space-y-2">
            {(['transferencia', 'mercadopago'] as MetodoPago[])
              .filter((m) => m !== 'mercadopago' || mpEnabled)
              .filter((m) => m !== 'transferencia' || cuentasPago.length > 0)
              .map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors ${
                    metodoPago === m
                      ? 'border-primary bg-primary/10'
                      : 'border-foreground/16 hover:bg-foreground/5'
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      value={m}
                      {...register('metodo_pago')}
                      className="mt-1 size-4 accent-[var(--primary)]"
                    />
                    <span className="font-medium text-foreground">
                      {METODO_PAGO_LABEL[m]}
                      {m === 'transferencia' && descuentoTransferenciaPct > 0 && (
                        <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                          {descuentoTransferenciaPct}% OFF
                        </span>
                      )}
                    </span>
                  </span>
                  {metodoPago === m && (
                    <div className="pl-7">
                      <NotaMetodoPago metodo={m} cuentasPago={cuentasPago} />
                    </div>
                  )}
                </label>
              ))}
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="notas">Notas (opcional)</Label>
          <Textarea id="notas" {...register('notas')} placeholder="¿Algo que quieras aclarar?" />
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-foreground/12 p-4">
          <h2 className="font-semibold text-foreground">Tu pedido</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.producto_id} className="flex justify-between gap-2">
                <span className="text-foreground/70">
                  {i.cantidad}× {i.nombre}
                </span>
                <span className="shrink-0 text-foreground">{formatARS(i.precio * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="my-3 h-px bg-foreground/12" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/70">Subtotal</span>
              <span className="text-foreground">{formatARS(totalPrecio)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between">
                <span className="text-foreground/70">Descuento transferencia ({descuentoTransferenciaPct}%)</span>
                <span className="text-foreground">-{formatARS(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-foreground/70">Envío</span>
              <span className="text-foreground">
                {costoEnvio != null
                  ? formatARS(costoEnvio)
                  : envioCotizado
                    ? 'ingresá tu CP'
                    : 'elegí tu zona'}
              </span>
            </div>
          </div>
          <div className="my-3 h-px bg-foreground/12" />
          <div className="flex justify-between text-lg font-bold text-foreground">
            <span>Total</span>
            <span>{formatARS(total)}</span>
          </div>
          <PrimaryButton type="submit" className="mt-4 w-full justify-center" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Confirmar pedido'}
          </PrimaryButton>
          <p className="mt-2 text-center text-xs text-foreground/60">
            {metodoPago === 'mercadopago'
              ? 'Te llevamos a Mercado Pago para pagar al toque.'
              : 'Coordinamos el envío por WhatsApp apenas confirmes.'}
          </p>
        </div>
      </aside>
    </form>
  )
}
