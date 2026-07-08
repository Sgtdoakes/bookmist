import { createClient } from '@/lib/supabase/public'
import { storeConfig } from '@/lib/store-config'
import type { EstiloBloque } from '@/lib/estilo-secciones'
import type { PaginaSeccionRow, Producto } from '@/types/db'

// Secciones editables de las páginas (Fase 5b, extendido en 6c). Los 7 tipos
// originales son la "página furniture" fija del diseño de Dani (uno por
// página, sin estilo editable). `texto`, `productos` y `banner` son bloques
// libres: se pueden agregar/duplicar/quitar en cualquier cantidad y en
// cualquier página (`home`, `productos`, `producto_detalle`), y tienen
// estilo (fondo/tamaño/radio/alineación) editable — el "lienzo libre" que
// antes no existía.

export type SeccionTipo =
  | 'hero'
  | 'beneficios'
  | 'categorias'
  | 'mas_vendidos'
  | 'sobre_mi'
  | 'resenas'
  | 'instagram'
  | 'texto'
  | 'productos'
  | 'banner'
  | 'libre'

// Tipos "furniture" fijos (uno por página, definidos por el diseño original
// de Dani) vs. bloques libres (repetibles, con estilo editable) — el
// builder del admin solo ofrece agregar estos últimos.
export const TIPOS_BLOQUE_LIBRE: SeccionTipo[] = ['texto', 'productos', 'banner', 'libre']

export type HeroConfig = {
  eyebrow: string
  titulo: string
  subtitulo: string
  ctaTexto: string
  imagen: string | null
  estilo: EstiloBloque
}
export type BeneficioItem = { emoji: string; texto: string }
export type BeneficiosConfig = { items: BeneficioItem[]; estilo: EstiloBloque }
export type CategoriaItem = { id: string; titulo: string; subtitulo: string; imagen: string | null }
export type CategoriasConfig = {
  eyebrow: string
  titulo: string
  categorias: CategoriaItem[]
  estilo: EstiloBloque
}
// Mismo shape que ProductosConfig (más abajo): "Más vendidos" es
// conceptualmente el mismo carrusel de productos, con fuente configurable,
// solo que vive en el slot furniture en vez de agregarse como bloque libre
// — no hace falta duplicar los campos.
export type MasVendidosConfig = ProductosConfig
export type SobreMiConfig = {
  eyebrow: string
  titulo: string
  texto: string
  texto2: string
  firma: string
  imagen: string | null
  estilo: EstiloBloque
}
export type ResenaItem = { nombre: string; texto: string }
export type ResenasConfig = { eyebrow: string; titulo: string; items: ResenaItem[]; estilo: EstiloBloque }
export type PostInstagram = { id: string; imagen: string | null }
export type InstagramConfig = { titulo: string; posts: PostInstagram[]; estilo: EstiloBloque }

export type TextoConfig = {
  eyebrow: string
  titulo: string
  texto: string
  ctaTexto: string
  ctaHref: string
  estilo: EstiloBloque
}

export type ProductosFuente = 'todos' | 'destacados' | 'novedades' | 'categoria' | 'manual'
export type ProductosConfig = {
  eyebrow: string
  titulo: string
  fuente: ProductosFuente
  categoria: string
  productos: string[]
  limite: number
  estilo: EstiloBloque
}

export type BannerConfig = {
  eyebrow: string
  titulo: string
  texto: string
  imagen: string | null
  ctaTexto: string
  ctaHref: string
  estilo: EstiloBloque
}

// Bloque "Libre": armado por piezas sueltas (no un esquema fijo de campos).
// Cada elemento tiene su propio `id` estable (para poder reordenar por
// drag-and-drop en el lienzo sin depender del índice del array).
export type ElementoLibreTipo = 'titulo' | 'parrafo' | 'imagen' | 'boton' | 'espacio'
export type ElementoLibre =
  | { id: string; tipo: 'titulo'; texto: string }
  | { id: string; tipo: 'parrafo'; texto: string }
  | { id: string; tipo: 'imagen'; url: string | null }
  | { id: string; tipo: 'boton'; texto: string; href: string }
  | { id: string; tipo: 'espacio'; alto: 'sm' | 'md' | 'lg' }
export type LibreConfig = { elementos: ElementoLibre[]; estilo: EstiloBloque }

export type SeccionConfigMap = {
  hero: HeroConfig
  beneficios: BeneficiosConfig
  categorias: CategoriasConfig
  mas_vendidos: MasVendidosConfig
  sobre_mi: SobreMiConfig
  resenas: ResenasConfig
  instagram: InstagramConfig
  texto: TextoConfig
  productos: ProductosConfig
  banner: BannerConfig
  libre: LibreConfig
}

// Union discriminada: en un switch/if sobre `tipo`, TypeScript angosta
// `config` al shape correcto de cada bloque.
export type SeccionResuelta = {
  [K in SeccionTipo]: { id: string; tipo: K; config: SeccionConfigMap[K] }
}[SeccionTipo]

// Contenido por defecto: el mismo que estaba hardcodeado en cada componente
// antes de esta fase. Si la tabla está vacía (o Supabase no está
// configurado), la home se ve exactamente igual que siempre.
function defaults(): SeccionConfigMap {
  return {
    hero: {
      eyebrow: 'Bookmist Editorial',
      titulo: 'Palabras que se sienten en las manos',
      subtitulo: 'Kits literarios pensados para pausar el ruido y perderte, otra vez, en una buena historia.',
      ctaTexto: 'Descubrir los kits',
      imagen: null,
      estilo: {},
    },
    beneficios: {
      items: [
        { emoji: '💳', texto: '3 cuotas sin interés +$75.000' },
        { emoji: '📦', texto: 'Envíos a todo el país' },
        { emoji: '💸', texto: '10% OFF transferencia' },
      ],
      estilo: {},
    },
    categorias: {
      eyebrow: 'Explorá',
      titulo: 'Nuestras categorías',
      // Ids fijos (no crypto.randomUUID()): defaults() se recalcula cada vez
      // que resolverSeccion() completa un config guardado que todavía no
      // tiene "categorias" — con ids aleatorios, dos llamadas separadas
      // (bloques vs. baseline en PageBuilder) generarían ids distintos y el
      // lienzo se vería "sin guardar" apenas se carga, sin que nadie tocó nada.
      categorias: [
        { id: 'cat-kits', titulo: 'Kits literarios', subtitulo: 'Libro + objetos elegidos para vivir la historia', imagen: null },
        { id: 'cat-cajas', titulo: 'Cajas literarias', subtitulo: 'Papelería y detalles para tu rincón de lectura', imagen: null },
        { id: 'cat-marcapaginas', titulo: 'Marcapáginas', subtitulo: 'Pequeños detalles hechos a mano', imagen: null },
      ],
      estilo: {},
    },
    mas_vendidos: {
      eyebrow: 'Los favoritos de la comunidad',
      titulo: 'Más vendidos',
      fuente: 'destacados',
      categoria: '',
      productos: [],
      limite: 12,
      estilo: {},
    },
    sobre_mi: {
      eyebrow: 'Sobre mí',
      titulo: 'Hola, soy Daniela',
      texto:
        'Soy Daniela, y este emprendimiento nace de mi pasión por descubrir historias increíbles. Siempre fui de sumergirme en el terror, los thrillers, la ficción contemporánea y el manga...',
      texto2:
        'Este es un proyecto que armo con las manos y con calma, pensando cada kit como si fuera un regalo para una amiga lectora.',
      firma: '— Daniela, fundadora de Bookmist',
      imagen: null,
      estilo: {},
    },
    resenas: {
      eyebrow: 'Lo que dicen nuestras lectoras',
      titulo: 'Reseñas',
      items: [
        {
          nombre: 'Martina R.',
          texto: 'Abrí la caja y sentí que me abrazaban. Cada detalle tiene alma, se nota que está pensado con cariño.',
        },
        {
          nombre: 'Lucía G.',
          texto:
            'El marcapáginas de plumas es precioso, y el libro que eligieron para mí fue exactamente lo que necesitaba leer.',
        },
        {
          nombre: 'Sofía P.',
          texto: 'Se nota el cuidado en cada textura. Mi rincón de lectura ahora es muchísimo más lindo gracias a Bookmist.',
        },
      ],
      estilo: {},
    },
    instagram: {
      titulo: `Seguinos en ${storeConfig.instagramHandle}`,
      posts: Array.from({ length: 5 }, (_, i) => ({ id: `post-${i + 1}`, imagen: null })),
      estilo: {},
    },
    texto: {
      eyebrow: '',
      titulo: 'Título del bloque',
      texto: 'Escribí acá el contenido de este bloque.',
      ctaTexto: '',
      ctaHref: '',
      estilo: {},
    },
    productos: {
      eyebrow: '',
      titulo: 'Productos',
      fuente: 'destacados',
      categoria: '',
      productos: [],
      limite: 8,
      estilo: {},
    },
    banner: {
      eyebrow: '',
      titulo: 'Título del banner',
      texto: '',
      imagen: null,
      ctaTexto: '',
      ctaHref: '',
      estilo: {},
    },
    libre: {
      elementos: [{ id: 'elemento-inicial', tipo: 'titulo', texto: 'Título' }],
      estilo: {},
    },
  }
}

// Orden por defecto (el orden actual del diseño de Dani), para cuando la
// tabla está vacía. Los bloques libres (texto/productos/banner) nunca
// forman parte de este set — solo existen si Dani los agrega a mano.
const ORDEN_DEFECTO: SeccionTipo[] = [
  'hero',
  'beneficios',
  'categorias',
  'mas_vendidos',
  'sobre_mi',
  'resenas',
  'instagram',
]

// Todos los tipos válidos (furniture fijo + bloques libres) — para validar
// filas leídas de la base, tanto acá como en el inspector del admin.
export const TIPOS_CONOCIDOS: SeccionTipo[] = [...ORDEN_DEFECTO, ...TIPOS_BLOQUE_LIBRE]

function esSeccionTipo(v: string): v is SeccionTipo {
  return (TIPOS_CONOCIDOS as string[]).includes(v)
}

// Combina lo guardado con los valores por defecto: un campo ausente en la
// config guardada (por ejemplo, porque se agregó después) no rompe nada,
// simplemente usa el default. Función pura, fácil de testear.
// Genérica en K: pasar un tipo literal (ej. resolverSeccion('hero', {}))
// angosta el resultado a ese shape de config, sin necesitar un cast en cada
// lugar que la llama.
export function resolverSeccion<K extends SeccionTipo>(
  tipo: K,
  configGuardada: Record<string, unknown>,
): Extract<SeccionResuelta, { tipo: K }> {
  const base = defaults()[tipo]
  return { id: tipo, tipo, config: { ...base, ...configGuardada } } as Extract<
    SeccionResuelta,
    { tipo: K }
  >
}

// El set de 7 secciones fijas (hero/beneficios/categorías/...) es
// específico del diseño original de la home — solo tiene sentido como
// fallback ahí. Cualquier otra página (catálogo, ficha de producto,
// institucionales) con 0 filas guardadas simplemente no tiene bloques
// todavía: [] es la respuesta correcta, no "mostrar la home".
function seccionesPorDefecto(pagina: string): SeccionResuelta[] {
  if (pagina !== 'home') return []
  return ORDEN_DEFECTO.map((tipo) => resolverSeccion(tipo, {}))
}

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Secciones activas de una página, en orden, ya resueltas (con sus valores
// por defecto aplicados). Es lo que consume la página pública.
export async function getSeccionesPagina(pagina: string): Promise<SeccionResuelta[]> {
  if (!configured()) return seccionesPorDefecto(pagina)
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pagina_secciones')
      .select('id, tipo, config')
      .eq('pagina', pagina)
      .eq('activo', true)
      .order('orden', { ascending: true })
    if (error) throw error
    if (!data || data.length === 0) return seccionesPorDefecto(pagina)
    // resolverSeccion() pone id=tipo (pensado para cuando cada tipo aparece
    // una sola vez, como los furniture de la home) — con bloques libres
    // repetibles (varios "productos"/"texto"/etc. en la misma página) eso
    // genera ids duplicados y React se queja de keys repetidas. Acá sí hace
    // falta el id real de la fila.
    return data
      .filter((r) => esSeccionTipo(r.tipo))
      .map((r) => ({ ...resolverSeccion(r.tipo as SeccionTipo, r.config ?? {}), id: r.id }))
  } catch {
    return seccionesPorDefecto(pagina)
  }
}

export type SeccionAdmin = {
  id: string
  tipo: string
  orden: number
  activo: boolean
  config: Record<string, unknown>
}

// Lo que necesita el lienzo en vivo del admin para renderizar un bloque:
// igual a `SeccionResuelta`, pero con los productos ya resueltos (no la
// fuente/ids) para 'productos' y 'mas_vendidos' — los únicos dos tipos que
// necesitan datos del servidor para saber qué mostrar. El resto de los
// tipos son puros: su config YA ES su contenido.
export type SeccionPreview = SeccionResuelta & { productosResueltos?: Producto[] }

// Todas las secciones (incl. inactivas) para el builder del admin. A
// diferencia de getSeccionesPagina, esto lo llaman Server Components/Actions
// ya autenticados, así que recibe el cliente en vez de crear uno propio.
export function filasAAdmin(filas: PaginaSeccionRow[]): SeccionAdmin[] {
  return filas.map((f) => ({
    id: f.id,
    tipo: f.tipo,
    orden: f.orden,
    activo: f.activo,
    config: (f.config as Record<string, unknown>) ?? {},
  }))
}
