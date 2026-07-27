'use client'

import Script from 'next/script'

type Props = {
  merchantId: string
  orderId: string
  email: string
  estimatedDeliveryDate: string
}

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
      surveyoptin: {
        render: (opts: {
          merchant_id: number
          order_id: string
          email: string
          delivery_country: string
          estimated_delivery_date: string
        }) => void
      }
    }
  }
}

// Opt-in de Google Customer Reviews (Fase 8h) — se muestra una vez en la
// confirmación de pedido, si el cliente acepta Google le manda una encuesta
// de calificación más adelante. Bookmist envía solo dentro de Argentina, así
// que delivery_country queda fijo. No se manda `products`/GTIN: los kits/
// marcapáginas de Dani son artesanales, sin código de barras.
export function GoogleCustomerReviews({ merchantId, orderId, email, estimatedDeliveryDate }: Props) {
  return (
    <Script
      src="https://apis.google.com/js/platform.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.gapi?.load('surveyoptin', () => {
          window.gapi?.surveyoptin.render({
            merchant_id: Number(merchantId),
            order_id: orderId,
            email,
            delivery_country: 'AR',
            estimated_delivery_date: estimatedDeliveryDate,
          })
        })
      }}
    />
  )
}
