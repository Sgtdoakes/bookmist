// Tipos de la base de datos de Supabase para Bookmist.
// Escritos a mano para que coincidan con las migraciones en /supabase/migrations.

export type ProductoTipo = 'caja' | 'kit' | 'libro' | 'accesorio'
export type MetodoPago = 'transferencia' | 'efectivo' | 'mercadopago' | 'deposito'
export type EstadoPedido = 'pendiente' | 'pagado' | 'cancelado'

export type Database = {
  public: {
    Tables: {
      productos: {
        Row: {
          id: string
          slug: string
          nombre: string
          tipo: ProductoTipo
          // Solo aplica a productos tipo "libro" (informativo, no hay tipo
          // separado desde la fusión con la biblioteca — Fase 6h).
          autor: string | null
          descripcion: string | null
          precio: number
          stock: number
          imagen_principal: string | null
          imagenes_galeria: string[]
          // Para la cotización de Andreani (migración 0023) — cada bulto
          // necesita gramos y dimensiones, si no la API no cotiza.
          peso_gramos: number
          alto_cm: number
          ancho_cm: number
          largo_cm: number
          // Variantes (migración 0028): productos con el mismo grupo son
          // variantes entre sí (ej. mismo kit en distintos colores). Sirve
          // para cualquier tipo desde la 0031, que soltó la restricción a
          // 'caja'/'kit'. variante_etiqueta es el texto corto propio de ESTE
          // producto dentro del grupo (ej. "Celeste").
          variante_grupo_id: string | null
          variante_etiqueta: string | null
          activo: boolean
          orden: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          nombre: string
          tipo: ProductoTipo
          autor?: string | null
          descripcion?: string | null
          precio?: number
          stock?: number
          imagen_principal?: string | null
          imagenes_galeria?: string[]
          peso_gramos?: number
          alto_cm?: number
          ancho_cm?: number
          largo_cm?: number
          variante_grupo_id?: string | null
          variante_etiqueta?: string | null
          activo?: boolean
          orden?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['productos']['Insert']>
        Relationships: []
      }
      producto_items: {
        Row: {
          id: string
          producto_id: string
          item_id: string
          cantidad: number
          orden: number
        }
        Insert: {
          id?: string
          producto_id: string
          item_id: string
          cantidad?: number
          orden?: number
        }
        Update: Partial<Database['public']['Tables']['producto_items']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'producto_items_producto_id_fkey'
            columns: ['producto_id']
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'producto_items_item_id_fkey'
            columns: ['item_id']
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
        ]
      }
      categorias: {
        Row: {
          id: string
          slug: string
          nombre: string
          orden: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          nombre: string
          orden?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['categorias']['Insert']>
        Relationships: []
      }
      producto_categorias: {
        Row: {
          producto_id: string
          categoria_id: string
        }
        Insert: {
          producto_id: string
          categoria_id: string
        }
        Update: Partial<Database['public']['Tables']['producto_categorias']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'producto_categorias_producto_id_fkey'
            columns: ['producto_id']
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'producto_categorias_categoria_id_fkey'
            columns: ['categoria_id']
            referencedRelation: 'categorias'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          id: string
          numero_pedido: string
          cliente_nombre: string
          cliente_email: string
          cliente_telefono: string
          // Migración 0027 — default '' para no romper pedidos históricos;
          // el checkout exige un valor real para los pedidos nuevos.
          cliente_dni: string
          direccion_envio: string
          zona_envio: string | null
          costo_envio: number | null
          metodo_pago: MetodoPago
          estado: EstadoPedido
          // Monto descontado por pagar con transferencia + cupón de
          // bienvenida si corresponde, combinados (migración 0023, 0026).
          descuento: number
          // Código de cupón usado, si usó uno (migración 0026) — solo a fines
          // de que Dani lo vea en el pedido, el monto ya está en `descuento`.
          // Es el string que tipeó el cliente: sobrevive aunque el cupón se
          // renombre o se borre.
          cupon_codigo: string | null
          // A qué cupón corresponde (migración 0030). Los usos se cuentan por
          // acá y no por el string, para que renombrar un cupón no le resetee
          // la cuenta y regale descuentos de más.
          cupon_id: string | null
          total: number
          notas: string | null
          leido: boolean
          mp_preference_id: string | null
          mp_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          numero_pedido?: string
          cliente_nombre: string
          cliente_email: string
          cliente_telefono: string
          cliente_dni?: string
          direccion_envio: string
          zona_envio?: string | null
          costo_envio?: number | null
          metodo_pago: MetodoPago
          estado?: EstadoPedido
          descuento?: number
          cupon_codigo?: string | null
          cupon_id?: string | null
          total?: number
          notas?: string | null
          leido?: boolean
          mp_preference_id?: string | null
          mp_payment_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          producto_id: string | null
          nombre: string
          precio_unitario: number
          cantidad: number
        }
        Insert: {
          id?: string
          order_id: string
          producto_id?: string | null
          nombre: string
          precio_unitario: number
          cantidad: number
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_producto_id_fkey'
            columns: ['producto_id']
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
        ]
      }
      zonas_envio: {
        Row: {
          id: string
          nombre: string
          costo: number
          activo: boolean
          orden: number
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          costo?: number
          activo?: boolean
          orden?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['zonas_envio']['Insert']>
        Relationships: []
      }
      configuracion: {
        Row: { clave: string; valor: string; updated_at: string }
        Insert: { clave: string; valor: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['configuracion']['Insert']>
        Relationships: []
      }
      paginas: {
        Row: {
          id: string
          slug: string
          titulo: string
          activo: boolean
          sistema: boolean
          orden: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          titulo: string
          activo?: boolean
          sistema?: boolean
          orden?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['paginas']['Insert']>
        Relationships: []
      }
      nav_links: {
        Row: {
          id: string
          label: string
          href: string
          orden: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          href: string
          orden?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['nav_links']['Insert']>
        Relationships: []
      }
      pagina_secciones: {
        Row: {
          id: string
          pagina: string
          tipo: string
          orden: number
          activo: boolean
          config: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pagina?: string
          tipo: string
          orden?: number
          activo?: boolean
          config?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pagina_secciones']['Insert']>
        Relationships: []
      }
      suscriptores_newsletter: {
        Row: {
          id: string
          email: string
          nombre: string
          cumpleanos: string | null
          provincia: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          nombre: string
          cumpleanos?: string | null
          provincia?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['suscriptores_newsletter']['Insert']>
        Relationships: []
      }
      cupones: {
        Row: {
          id: string
          codigo: string
          pct: number
          activo: boolean
          // null = sin tope de usos. 1 = un cupón de un solo uso.
          usos_maximos: number | null
          // Cuánto se puede llevar UNA misma persona. null = sin límite.
          usos_maximos_por_email: number | null
          requiere_suscripcion: boolean
          // Medio de pago exigido por el cupón (0032). null = sirve con
          // cualquiera; 'transferencia' = solo transferencia, etc.
          metodo_pago_requerido: MetodoPago | null
          // Muerto desde la 0030: lo reemplazó usos_maximos_por_email. Sigue
          // en la tabla (con default) hasta que se borre en una migración
          // posterior; nadie lo lee.
          una_vez_por_email: boolean
          es_bienvenida: boolean
          nota: string | null
          created_at: string
        }
        Insert: {
          id?: string
          codigo: string
          pct: number
          activo?: boolean
          usos_maximos?: number | null
          usos_maximos_por_email?: number | null
          requiere_suscripcion?: boolean
          metodo_pago_requerido?: MetodoPago | null
          es_bienvenida?: boolean
          nota?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['cupones']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      // Marca un pedido como pagado y descuenta el stock en una sola
      // transacción (migración 0022). Idempotente ante reintentos de MP.
      confirmar_pago_pedido: {
        Args: { p_order_id: string; p_payment_id: string }
        Returns: boolean
      }
    }
    Enums: {
      producto_tipo: ProductoTipo
      metodo_pago: MetodoPago
      estado_pedido: EstadoPedido
    }
    CompositeTypes: Record<string, never>
  }
}

// Atajos de tipos para usar en toda la app.
export type Producto = Database['public']['Tables']['productos']['Row']
export type ProductoInsert = Database['public']['Tables']['productos']['Insert']
export type ProductoUpdate = Database['public']['Tables']['productos']['Update']
export type ProductoItem = Database['public']['Tables']['producto_items']['Row']

// Producto con su contenido curado resuelto (para la página de detalle) —
// "qué incluye" ahora apunta a otros productos, no a una biblioteca aparte
// (Fase 6h: fusión de items_catalogo en productos).
export type ProductoConItems = Producto & {
  producto_items: (ProductoItem & { item: Producto })[]
  categorias: Categoria[]
}

export type Categoria = Database['public']['Tables']['categorias']['Row']

// Producto con sus categorías resueltas (catálogo interactivo, admin).
export type ProductoConCategorias = Producto & { categorias: Categoria[] }

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type ZonaEnvio = Database['public']['Tables']['zonas_envio']['Row']

// Pedido con sus items resueltos (para el panel de administración).
export type OrderConItems = Order & { order_items: OrderItem[] }

export type PaginaSeccionRow = Database['public']['Tables']['pagina_secciones']['Row']
export type NavLink = Database['public']['Tables']['nav_links']['Row']
export type PaginaRow = Database['public']['Tables']['paginas']['Row']
export type SuscriptorNewsletter = Database['public']['Tables']['suscriptores_newsletter']['Row']
export type SuscriptorNewsletterInsert = Database['public']['Tables']['suscriptores_newsletter']['Insert']
export type Cupon = Database['public']['Tables']['cupones']['Row']
export type CuponInsert = Database['public']['Tables']['cupones']['Insert']
