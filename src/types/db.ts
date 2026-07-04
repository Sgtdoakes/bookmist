// Tipos de la base de datos de Supabase para Bookmist.
// Escritos a mano para que coincidan con las migraciones en /supabase/migrations.

export type ProductoTipo = 'caja' | 'kit'
export type ItemTipo = 'libro' | 'accesorio'

export type Database = {
  public: {
    Tables: {
      productos: {
        Row: {
          id: string
          slug: string
          nombre: string
          tipo: ProductoTipo
          categoria: string | null
          descripcion: string | null
          precio: number
          stock: number
          imagen_principal: string | null
          destacado: boolean
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
          categoria?: string | null
          descripcion?: string | null
          precio?: number
          stock?: number
          imagen_principal?: string | null
          destacado?: boolean
          activo?: boolean
          orden?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['productos']['Insert']>
        Relationships: []
      }
      items_catalogo: {
        Row: {
          id: string
          tipo: ItemTipo
          nombre: string
          autor: string | null
          descripcion: string | null
          imagen: string | null
          precio: number | null
          stock: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tipo: ItemTipo
          nombre: string
          autor?: string | null
          descripcion?: string | null
          imagen?: string | null
          precio?: number | null
          stock?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['items_catalogo']['Insert']>
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
            referencedRelation: 'items_catalogo'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      categorias_distintas: {
        Args: Record<string, never>
        Returns: { categoria: string }[]
      }
    }
    Enums: {
      producto_tipo: ProductoTipo
      item_tipo: ItemTipo
    }
    CompositeTypes: Record<string, never>
  }
}

// Atajos de tipos para usar en toda la app.
export type Producto = Database['public']['Tables']['productos']['Row']
export type ProductoInsert = Database['public']['Tables']['productos']['Insert']
export type ProductoUpdate = Database['public']['Tables']['productos']['Update']
export type ItemCatalogo = Database['public']['Tables']['items_catalogo']['Row']
export type ProductoItem = Database['public']['Tables']['producto_items']['Row']

// Producto con su contenido curado resuelto (para la página de detalle).
export type ProductoConItems = Producto & {
  producto_items: (ProductoItem & { items_catalogo: ItemCatalogo })[]
}
