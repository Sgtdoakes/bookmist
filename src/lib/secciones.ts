import { createClient } from '@/lib/supabase/public'
import { storeConfig } from '@/lib/store-config'
import type { PaginaSeccionRow } from '@/types/db'

// Secciones editables de la home (Fase 5b). Set fijo de bloques predefinidos
// (no un lienzo libre como en Martín Libros): Daniela puede reordenarlos,
// ocultarlos y editar su texto desde /admin/pagina, pero no crear tipos
// nuevos — el diseño de Dani ya define qué bloques existen.

export type SeccionTipo =
  | 'hero'
  | 'beneficios'
  | 'categorias'
  | 'mas_vendidos'
  | 'sobre_mi'
  | 'resenas'
  | 'instagram'

export type HeroConfig = { eyebrow: string; titulo: string; subtitulo: string; ctaTexto: string }
export type BeneficioItem = { emoji: string; texto: string }
export type BeneficiosConfig = { items: BeneficioItem[] }
export type CategoriasConfig = { eyebrow: string; titulo: string }
export type MasVendidosConfig = { eyebrow: string; titulo: string }
export type SobreMiConfig = { eyebrow: string; titulo: string; texto: string; texto2: string; firma: string }
export type ResenaItem = { nombre: string; texto: string }
export type ResenasConfig = { eyebrow: string; titulo: string; items: ResenaItem[] }
export type InstagramConfig = { titulo: string }

export type SeccionConfigMap = {
  hero: HeroConfig
  beneficios: BeneficiosConfig
  categorias: CategoriasConfig
  mas_vendidos: MasVendidosConfig
  sobre_mi: SobreMiConfig
  resenas: ResenasConfig
  instagram: InstagramConfig
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
    },
    beneficios: {
      items: [
        { emoji: '💳', texto: '3 cuotas sin interés +$75.000' },
        { emoji: '📦', texto: 'Envíos a todo el país' },
        { emoji: '💸', texto: '10% OFF transferencia' },
      ],
    },
    categorias: { eyebrow: 'Explorá', titulo: 'Nuestras categorías' },
    mas_vendidos: { eyebrow: 'Los favoritos de la comunidad', titulo: 'Más vendidos' },
    sobre_mi: {
      eyebrow: 'Sobre mí',
      titulo: 'Hola, soy Daniela',
      texto:
        'Soy Daniela, y este emprendimiento nace de mi pasión por descubrir historias increíbles. Siempre fui de sumergirme en el terror, los thrillers, la ficción contemporánea y el manga...',
      texto2:
        'Este es un proyecto que armo con las manos y con calma, pensando cada kit como si fuera un regalo para una amiga lectora.',
      firma: '— Daniela, fundadora de Bookmist',
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
    },
    instagram: { titulo: `Seguinos en ${storeConfig.instagramHandle}` },
  }
}

// Orden por defecto (el orden actual del diseño de Dani), para cuando la
// tabla está vacía.
const ORDEN_DEFECTO: SeccionTipo[] = [
  'hero',
  'beneficios',
  'categorias',
  'mas_vendidos',
  'sobre_mi',
  'resenas',
  'instagram',
]

function esSeccionTipo(v: string): v is SeccionTipo {
  return (ORDEN_DEFECTO as string[]).includes(v)
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

function seccionesPorDefecto(): SeccionResuelta[] {
  return ORDEN_DEFECTO.map((tipo) => resolverSeccion(tipo, {}))
}

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Secciones activas de una página, en orden, ya resueltas (con sus valores
// por defecto aplicados). Es lo que consume la página pública.
export async function getSeccionesPagina(pagina: string): Promise<SeccionResuelta[]> {
  if (!configured()) return seccionesPorDefecto()
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pagina_secciones')
      .select('tipo, config')
      .eq('pagina', pagina)
      .eq('activo', true)
      .order('orden', { ascending: true })
    if (error) throw error
    if (!data || data.length === 0) return seccionesPorDefecto()
    return data
      .filter((r) => esSeccionTipo(r.tipo))
      .map((r) => resolverSeccion(r.tipo as SeccionTipo, r.config ?? {}))
  } catch {
    return seccionesPorDefecto()
  }
}

export type SeccionAdmin = {
  id: string
  tipo: string
  orden: number
  activo: boolean
  config: Record<string, unknown>
}

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
