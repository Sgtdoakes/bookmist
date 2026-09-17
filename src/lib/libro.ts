import type { Producto } from '@/types/db'

// Presentación de un producto tipo "libro". Vive aparte de src/lib/isbn.ts
// (que sale a buscar datos) y de isbn-formato.ts (que los limpia): esto es
// solo cómo se ve la ficha en el sitio público.

// 'blanda' | 'dura' es lo que guarda la base (migración 0036); esto es lo que
// se lee en la ficha.
export function formatoLegible(formato: string | null): string | null {
  if (formato === 'blanda') return 'Tapa blanda'
  if (formato === 'dura') return 'Tapa dura'
  return null
}

export type FilaFicha = { etiqueta: string; valor: string }

// Las filas de "Ficha técnica" que tienen algo que mostrar. Devuelve [] cuando
// el producto no es un libro o cuando no se cargó ningún dato — la ficha
// entera se oculta sola en ese caso, en vez de quedar un título con un vacío
// abajo. El autor NO está acá: va debajo del título, que es donde se lee.
export function fichaTecnicaDeLibro(producto: Producto): FilaFicha[] {
  if (producto.tipo !== 'libro') return []

  const filas: FilaFicha[] = []
  const agregar = (etiqueta: string, valor: string | number | null) => {
    if (valor === null || valor === '') return
    filas.push({ etiqueta, valor: String(valor) })
  }

  agregar('Editorial', producto.editorial)
  agregar('Páginas', producto.paginas)
  agregar('Año', producto.anio_publicacion)
  agregar('Idioma', producto.idioma)
  agregar('Encuadernación', formatoLegible(producto.formato))
  // El ISBN va último: es el dato que menos se lee y el más largo.
  agregar('ISBN', producto.isbn)

  return filas
}
