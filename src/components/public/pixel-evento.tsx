'use client'

import { useEffect, useRef } from 'react'
import { fbTrack } from '@/lib/meta-pixel'

// Manda un evento del píxel de Meta al mostrarse una página. No dibuja nada:
// existe solo para poder disparar el evento desde una página que es Server
// Component (la ficha de producto, por ejemplo) sin volverla cliente entera.
//
// El payload se compara serializado y no por identidad: el objeto que le pasa
// la página se crea nuevo en cada render, así que comparar referencias
// mandaría el evento de más. Con esto, navegando de un producto a otro sin
// recargar (el componente sigue montado, cambian las props) se manda un
// ViewContent por producto, que es lo correcto.
export function PixelEvento({
  evento,
  params,
}: {
  evento: string
  params?: Record<string, unknown>
}) {
  const carga = JSON.stringify({ evento, params: params ?? null })
  // Se acuerda de lo último que mandó. React corre los efectos dos veces en
  // desarrollo (StrictMode) y sin esto cada ficha de producto registraba dos
  // ViewContent — en producción no pasaría, pero es la clase de diferencia
  // entre entornos que después hace dudar de los números en Events Manager.
  const ultimaEnviada = useRef<string | null>(null)

  useEffect(() => {
    if (ultimaEnviada.current === carga) return
    ultimaEnviada.current = carga
    const { evento: nombre, params: datos } = JSON.parse(carga) as {
      evento: string
      params: Record<string, unknown> | null
    }
    fbTrack(nombre, datos ?? undefined)
  }, [carga])

  return null
}
