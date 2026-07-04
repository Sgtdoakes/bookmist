import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/public/checkout-form'
import { storeConfig } from '@/lib/store-config'
import { mpConfigured } from '@/lib/mercadopago'

export const metadata: Metadata = {
  title: 'Confirmar pedido',
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
      <h1 className="font-heading text-3xl font-semibold text-foreground">Confirmá tu pedido</h1>
      <p className="mt-1 text-foreground/75">
        Completá tus datos de envío. Te contactamos para coordinar el pago.
      </p>
      <div className="mt-8">
        <CheckoutForm envioCosto={storeConfig.envioCosto} mpEnabled={mpConfigured()} />
      </div>
    </div>
  )
}
