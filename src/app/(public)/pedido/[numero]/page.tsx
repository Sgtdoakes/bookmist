import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PedidoConfirmadoContent } from '@/components/public/pedido-confirmado-content'
import { getCuentasPago, cuentaValida } from '@/lib/configuracion'
import { getPedidoPublico } from '@/lib/pedidos'

export const metadata: Metadata = {
  title: 'Tu pedido',
  // Un pedido es de una sola persona: no tiene por qué terminar en Google.
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ numero: string }>
  searchParams: Promise<{ t?: string; status?: string }>
}

export default async function PedidoConfirmadoPage({ params, searchParams }: Props) {
  const { numero } = await params
  const { t } = await searchParams

  // Con token (link del mail, o redirección propia del checkout) el pedido se
  // lee de la base: funciona para siempre y desde cualquier dispositivo. Sin
  // token se cae al camino viejo — el resumen que el navegador guardó en
  // sessionStorage al comprar — para no romper los links que ya estén dando
  // vueltas.
  const [cuentasPago, pedido] = await Promise.all([
    getCuentasPago(),
    t ? getPedidoPublico(numero, t) : Promise.resolve(null),
  ])

  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-6 py-16" />}>
      <PedidoConfirmadoContent
        numero={numero}
        pedido={pedido}
        cuentasPago={cuentasPago.filter(cuentaValida)}
      />
    </Suspense>
  )
}
