'use client'

import { useEffect, useState } from 'react'

type Estado = { cargando: boolean; dataUrl: string | null; error: boolean }

// QR real (BCRA "Transferencias 3.0") con el monto exacto ya cargado — se
// pide al servidor porque el total del carrito solo se conoce acá, en el
// cliente, mientras que el CUIT/CBU/alias de la cuenta viven server-side.
export function QrPagoTransferencia({
  cuentaId,
  monto,
  referencia,
}: {
  cuentaId: string
  monto: number
  referencia?: string
}) {
  const [estado, setEstado] = useState<Estado>({ cargando: true, dataUrl: null, error: false })

  useEffect(() => {
    let cancelado = false
    // Si monto/referencia cambian (ej. cambia la zona de envío) hay que
    // volver a "cargando" ya mismo — dejar el QR viejo visible mostraría un
    // monto incorrecto mientras llega el nuevo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado({ cargando: true, dataUrl: null, error: false })
    fetch('/api/qr-transferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuentaId, monto, referencia }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (cancelado) return
        setEstado(
          json.ok ? { cargando: false, dataUrl: json.dataUrl, error: false } : { cargando: false, dataUrl: null, error: true },
        )
      })
      .catch(() => {
        if (!cancelado) setEstado({ cargando: false, dataUrl: null, error: true })
      })
    return () => {
      cancelado = true
    }
  }, [cuentaId, monto, referencia])

  if (estado.error) return null

  if (estado.cargando || !estado.dataUrl) {
    return <div className="mx-auto h-44 w-44 animate-pulse rounded-lg bg-foreground/10" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data: URL generado al vuelo, next/image no lo optimiza.
    <img src={estado.dataUrl} alt="Código QR para pagar por transferencia" className="mx-auto h-44 w-44 rounded-lg bg-white p-2" />
  )
}
