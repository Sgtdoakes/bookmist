import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// isAdmin: verificado contra el servidor de Supabase Auth (auth.getUser(),
// no auth.getSession()) — getUser() valida el JWT con Supabase en cada
// llamada en vez de solo leer la cookie local, así que no se puede falsear
// desde el cliente. Con eso alcanza para decidir si mostrar los atajos al
// panel: nadie más que Dani, ya logueada, los va a ver en el HTML.
//
// cache() de React: el layout público y la ficha de producto lo preguntan
// cada uno por su lado dentro del mismo request (un layout no puede pasarle
// props a la página). Sin esto serían dos viajes a Supabase Auth por cada
// visita a una ficha de producto.
export const getIsAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user
})
