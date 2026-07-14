import { z } from 'zod'

// --- Checkout (sitio público) -------------------------------------------
// Dos modos de entrega (Fase 6k): envío a domicilio o retiro en persona
// (punto de retiro configurable en /admin/zonas). Con domicilio, el costo se
// resuelve de una de dos formas: cotización en vivo de Andreani por código
// postal (cp_envio, Fase 6d — el server SIEMPRE re-cotiza, nunca confía en
// el precio del navegador) o, si Andreani no está configurado/disponible,
// la zona manual (zona_id, el sistema original de la Fase 4a que queda como
// respaldo). Con retiro no hay dirección ni costo: el server pone ambos.
export const checkoutItemSchema = z.object({
  producto_id: z.uuid(),
  cantidad: z.number().int().positive(),
})

const checkoutBase = z.object({
  cliente_nombre: z.string().trim().min(2, 'Ingresá tu nombre'),
  cliente_email: z.email('Ingresá un email válido'),
  cliente_telefono: z.string().trim().min(6, 'Ingresá un teléfono de contacto'),
  // nullish (no .default): mantiene idénticos los tipos de entrada y salida,
  // que es lo que espera react-hook-form; ausente = domicilio (clientes con
  // el JS viejo en caché no mandan este campo).
  modo_envio: z.enum(['domicilio', 'retiro']).nullish(),
  // Obligatoria solo con envío a domicilio — ver el refine de abajo.
  direccion_envio: z.string().trim().max(300),
  zona_id: z.uuid('Elegí una zona de envío').nullish(),
  cp_envio: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Ingresá un código postal de 4 dígitos')
    .nullish(),
  metodo_pago: z.enum(['transferencia', 'deposito', 'efectivo', 'mercadopago']),
  notas: z.string().trim().max(500).nullish(),
})

// Con retiro no se valida nada del envío; con domicilio hacen falta la
// dirección y (CP o zona).
type DatosDeEnvio = {
  modo_envio?: 'domicilio' | 'retiro' | null
  direccion_envio: string
  zona_id?: string | null
  cp_envio?: string | null
}
const direccionValida = (d: DatosDeEnvio) => d.modo_envio === 'retiro' || d.direccion_envio.length >= 5
const envioDefinido = (d: DatosDeEnvio) => d.modo_envio === 'retiro' || !!d.zona_id || !!d.cp_envio
const MSG_DIRECCION = { message: 'Ingresá la dirección de envío', path: ['direccion_envio'] as (string | number)[] }
const MSG_ENVIO = { message: 'Falta definir el envío (código postal o zona).', path: ['cp_envio'] as (string | number)[] }

// Esquema del formulario (lo usa react-hook-form en el cliente). El form
// completa cp_envio O zona_id según el modo (Andreani vs. zonas manuales).
export const checkoutFormSchema = checkoutBase.refine(direccionValida, MSG_DIRECCION).refine(envioDefinido, MSG_ENVIO)
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>

// Esquema completo del pedido (lo valida la API, incluye los items).
export const checkoutSchema = checkoutBase
  .extend({
    items: z.array(checkoutItemSchema).min(1, 'El carrito está vacío'),
  })
  .refine(direccionValida, MSG_DIRECCION)
  .refine(envioDefinido, MSG_ENVIO)
export type CheckoutInput = z.infer<typeof checkoutSchema>

// --- Biblioteca de libros y accesorios (admin) ---------------------------
export const itemFormSchema = z.object({
  tipo: z.enum(['libro', 'accesorio']),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
  autor: z.string().trim().max(200).nullish(),
  descripcion: z.string().trim().max(2000).nullish(),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo').nullish(),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo').nullish(),
  activo: z.boolean(),
})
// z.coerce hace que el tipo de entrada (lo que espera react-hook-form en los
// inputs sin controlar) difiera del tipo de salida (lo que llega al submit
// ya coercionado) — dos tipos separados, patrón recomendado por
// @hookform/resolvers para esquemas con coerce.
export type ItemFormInput = z.input<typeof itemFormSchema>
export type ItemFormOutput = z.infer<typeof itemFormSchema>

// --- Configuración de marca (admin, Fase 6f-1) ---------------------------
const colorHex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Usá un color válido')
export const marcaFormSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  taglineHeader: z.string().trim().max(100),
  taglineFooter: z.string().trim().max(150),
  copyright: z.string().trim().max(150),
  email: z.email('Ingresá un email válido'),
  whatsapp: z.string().trim().max(20),
  instagram: z.union([z.url('Ingresá una URL válida'), z.literal('')]),
  instagramHandle: z.string().trim().max(50),
  tiktok: z.union([z.url('Ingresá una URL válida'), z.literal('')]),
  colorPrimario: colorHex,
  colorSecundario: colorHex,
  colorAcento: colorHex,
  metodosPago: z.string().trim().max(300),
  metodosEnvio: z.string().trim().max(300),
})
export type MarcaFormInput = z.input<typeof marcaFormSchema>
export type MarcaFormOutput = z.infer<typeof marcaFormSchema>
