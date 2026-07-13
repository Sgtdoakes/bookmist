import { ImageResponse } from 'next/og'
import { getMarcaConfig } from '@/lib/configuracion'

// Favicon dinámico: sirve el logo cargado en /admin/configuracion, así un
// cambio de logo en el panel se refleja en la pestaña del navegador sin
// tocar código ni redeployar. Revalida cada hora — un favicon puede ser
// viejo una hora sin que le importe a nadie, y evita pegarle a Storage en
// cada request.
export const revalidate = 3600

export default async function Icon() {
  const marca = await getMarcaConfig()

  if (marca.logoUrl) {
    try {
      const res = await fetch(marca.logoUrl, { next: { revalidate: 3600 } })
      if (res.ok) {
        return new Response(await res.arrayBuffer(), {
          headers: {
            'Content-Type': res.headers.get('content-type') ?? 'image/png',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    } catch {
      // Sin logo alcanzable: cae al fallback de abajo.
    }
  }

  // Fallback si no hay logo cargado: un librito sobre el violeta de la
  // marca, para no volver jamás al triángulo default de Vercel.
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3d3258',
          borderRadius: 8,
          fontSize: 20,
        }}
      >
        📖
      </div>
    ),
    { width: 32, height: 32 },
  )
}
