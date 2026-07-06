import { SeccionesDePagina } from '@/components/public/secciones-renderer'

// ISR: sin esto, el orden/contenido de las secciones quedaría estático desde
// el build y un cambio guardado en /admin/pagina no aparecería hasta el
// próximo deploy.
export const revalidate = 300

export default function HomePage() {
  return <SeccionesDePagina pagina="home" conDivisores />
}
