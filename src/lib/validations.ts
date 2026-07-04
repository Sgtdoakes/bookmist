import { z } from 'zod'

// --- Checkout (sitio público) -------------------------------------------
// Bookmist envía a todo el país (sin retiro en persona), así que la
// dirección siempre es obligatoria — a diferencia de Martín Libros no hay
// que ramificar el esquema por método de entrega.
export const checkoutItemSchema = z.object({
  producto_id: z.uuid(),
  cantidad: z.number().int().positive(),
})

const checkoutBase = z.object({
  cliente_nombre: z.string().trim().min(2, 'Ingresá tu nombre'),
  cliente_email: z.email('Ingresá un email válido'),
  cliente_telefono: z.string().trim().min(6, 'Ingresá un teléfono de contacto'),
  direccion_envio: z.string().trim().min(5, 'Ingresá la dirección de envío').max(300),
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
