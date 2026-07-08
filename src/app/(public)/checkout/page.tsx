import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/public/checkout-form'
import { getZonasEnvioActivas } from '@/lib/zonas'
import { mpConfigured } from '@/lib/mercadopago'
import { getDatosTransferencia, transferenciaCompleta } from '@/lib/configuracion'

// ISR: sin esto, la lista de zonas de envío queda estática desde el build y
// una zona nueva/editada en Supabase no aparecería hasta el próximo deploy.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Confirmar pedido',
}

export default async function CheckoutPage() {
  const [zonas, datosTransferencia] = await Promise.all([getZonasEnvioActivas(), getDatosTransferencia()])

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
      <h1 className="font-heading text-3xl font-semibold text-foreground">Confirmá tu pedido</h1>
      <p className="mt-1 text-foreground/75">Completá tus datos de envío y elegí cómo pagar.</p>
      <div className="mt-8">
        <CheckoutForm
          zonas={zonas}
          mpEnabled={mpConfigured()}
          datosTransferencia={transferenciaCompleta(datosTransferencia) ? datosTransferencia : null}
        />
      </div>
    </div>
  )
}
