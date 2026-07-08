import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PedidoConfirmadoContent } from '@/components/public/pedido-confirmado-content'
import { getCuentasPago, cuentaValida } from '@/lib/configuracion'

export const metadata: Metadata = {
  title: 'Pedido confirmado',
}

type Props = { params: Promise<{ numero: string }> }

export default async function PedidoConfirmadoPage({ params }: Props) {
  const { numero } = await params
  const cuentasPago = await getCuentasPago()

  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-6 py-16" />}>
      <PedidoConfirmadoContent numero={numero} cuentasPago={cuentasPago.filter(cuentaValida)} />
    </Suspense>
  )
}
