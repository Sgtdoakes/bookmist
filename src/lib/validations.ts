import { z } from 'zod'

// --- Checkout (sitio público) -------------------------------------------
// Bookmist envía a todo el país (sin retiro en persona), así que la
// dirección siempre es obligatoria — a diferencia de Martín Libros no hay
// que ramificar el esquema por método de entrega. El costo de envío se
// resuelve por zona (Fase 4a, manual — la API real de Andreani es Fase 4b).
export const checkoutItemSchema = z.object({
  producto_id: z.uuid(),
  cantidad: z.number().int().positive(),
})

const checkoutBase = z.object({
  cliente_nombre: z.string().trim().min(2, 'Ingresá tu nombre'),
  cliente_email: z.email('Ingresá un email válido'),
  cliente_telefono: z.string().trim().min(6, 'Ingresá un teléfono de contacto'),
  direccion_envio: z.string().trim().min(5, 'Ingresá la dirección de envío').max(300),
  zona_id: z.uuid('Elegí una zona de envío'),
  metodo_pago: z.enum(['transferencia', 'efectivo', 'mercadopago']),
  notas: z.string().trim().max(500).nullish(),
})

// Esquema del formulario (lo usa react-hook-form en el cliente).
export const checkoutFormSchema = checkoutBase
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>

// Esquema completo del pedido (lo valida la API, incluye los items).
export const checkoutSchema = checkoutBase.extend({
  items: z.array(checkoutItemSchema).min(1, 'El carrito está vacío'),
})
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
