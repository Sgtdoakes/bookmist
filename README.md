# Bookmist 📚✨

Sitio web de **Bookmist**, marca de cajas y kits literarios (libros curados +
accesorios). Este repo cubre, por ahora, las **Fases 1 a 5b**: landing pública
conectada a un catálogo real en Supabase, catálogo/carrito/checkout con pago
manual (transferencia/efectivo) y online con **Mercado Pago** (Checkout Pro:
QR, billetera y tarjetas en una sola integración), envío con **costo manual
por zona** (la API real de Andreani es la Fase 4b, cuando exista el contrato
comercial), un **panel de administración** (`/admin`) para gestionar
cajas/kits, la biblioteca de libros/accesorios, pedidos, zonas de envío y el
modo "reponiendo stock", y un **CMS de secciones arrastrables** para armar
la home (reordenar, ocultar y editar el texto de cada bloque sin tocar
código). Bookmist envía a todo el país (sin retiro en persona), así que el
checkout siempre pide dirección de envío — ver el historial de la
conversación de planificación para el roadmap completo.

---

## Stack técnico

- **Next.js 16** (App Router) + **TypeScript** (tipado estricto)
- **Supabase**: base de datos PostgreSQL, Auth (panel de administración) y storage
- **Tailwind CSS v4** + **shadcn/ui**
- **Vitest** para tests unitarios
- Pensado para desplegar en **Vercel** (free tier) + **Supabase** (free tier)

---

## Requisitos previos

- **Node.js 18.18 o superior** (recomendado Node 20+) y npm.
- Una cuenta gratuita en **[Supabase](https://supabase.com)**.
- *(Para producción)* Una cuenta gratuita en **[Vercel](https://vercel.com)**.

---

## Puesta en marcha local (paso a paso)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. Entrá a [app.supabase.com](https://app.supabase.com) y creá un proyecto nuevo.
2. Elegí una contraseña para la base y una región cercana (ej. *South America (São Paulo)*).
3. Esperá unos minutos a que el proyecto termine de crearse.

### 3. Crear las tablas (migraciones) y los datos de ejemplo

En el panel de Supabase, andá a **SQL Editor** y ejecutá, **en este orden**, el
contenido de cada archivo de la carpeta [`supabase/migrations`](./supabase/migrations):

1. `0001_init.sql` — tablas `productos`, `items_catalogo`, `producto_items`.
2. `0002_rls.sql` — reglas de seguridad (Row Level Security).
3. `0003_functions.sql` — trigger de `updated_at` y función `categorias_distintas`.
4. `0004_orders.sql` — tablas `orders` y `order_items` (pedidos, Fase 2).
5. `0005_orders_rls.sql` — RLS de pedidos (sin acceso público, ni lectura).
6. `0006_mercadopago.sql` — agrega `'mercadopago'` al enum de métodos de pago
   y las columnas `mp_preference_id`/`mp_payment_id` a `orders` (Fase 3).
7. `0007_zonas_envio.sql` — tabla `zonas_envio` (costo manual por zona) y
   columna `zona_envio` en `orders` (Fase 4a).
8. `0008_zonas_envio_rls.sql` — RLS de `zonas_envio` (lectura pública de
   zonas activas, escritura solo autenticado).
9. `0009_configuracion.sql` — tabla `configuracion` (clave/valor), usada por
   el modo "reponiendo stock" (Fase 5a).
10. `0010_pagina_secciones.sql` — tabla `pagina_secciones` (Fase 5b): las
    secciones editables de la home (una fila por tipo de bloque).

Después, para cargar cajas/kits, zonas de envío y las secciones de la home
con el contenido original de Dani, ejecutá:

11. [`supabase/seed.sql`](./supabase/seed.sql)

> Podés copiar y pegar cada archivo en una pestaña nueva del SQL Editor y apretar **Run**.

### 4. Configurar las variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp .env.example .env.local
```

Como mínimo necesitás las tres claves de Supabase. El resto tiene valores por
defecto razonables. Ver la tabla más abajo.

Las claves de Supabase están en **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` → *Project URL*
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → *anon public*
- `SUPABASE_SERVICE_ROLE_KEY` → *service_role* (⚠️ secreta, nunca compartir)

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El panel de
administración está en [http://localhost:3000/admin](http://localhost:3000/admin).

### 6. ⚠️ Cerrar el registro público y crear el usuario admin

> **Esto es obligatorio y es la base de la seguridad del panel.** El sistema
> considera **admin a cualquier usuario que pueda iniciar sesión**. Si dejás
> el registro abierto, cualquier persona podría crearse una cuenta y entrar
> al panel a editar el stock, los pedidos y los precios.

1. En Supabase, andá a **Authentication → Sign In / Providers** (o
   **Settings**) y **deshabilitá el registro público** (*"Allow new users to
   sign up"* / *Enable signups* en **OFF**).
2. Creá la cuenta de Daniela a mano en **Authentication → Users → Add user**
   (email + contraseña). Repetí por cada persona que tenga que entrar al
   panel.

---

## Variables de entorno

| Variable | ¿Obligatoria? | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clave pública (anon) de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Clave secreta para lecturas públicas cacheables. **No exponer.** |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL del sitio (`http://localhost:3000` en local). |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ⬜ | WhatsApp de Bookmist, solo dígitos. Sin este valor, el botón flotante no se muestra (pero el checkout funciona igual). |
| `NEXT_PUBLIC_STORE_*` / `NEXT_PUBLIC_INSTAGRAM_*` / `NEXT_PUBLIC_TIKTOK_URL` | ⬜ | Datos de marca (tienen valores por defecto). |
| `EMAIL_PROVIDER` / `OWNER_EMAIL` / `EMAIL_FROM` / `RESEND_API_KEY` / `SMTP_*` | ⬜ | Notificación por email de pedidos nuevos a Daniela. Sin configurar, el pedido igual se registra y queda el link de WhatsApp como respaldo. |
| `MP_ACCESS_TOKEN` | ⬜ | Access token de Mercado Pago (Checkout Pro). Sin esto, el checkout solo ofrece transferencia/efectivo. **Secreto.** |

---

## Mercado Pago (Checkout Pro)

1. Conseguí las credenciales en el panel de Mercado Pago → **Tus integraciones
   → Credenciales** (usá las de *prueba* mientras desarrollás, las de
   *producción* recién al salir en vivo).
2. Cargá `MP_ACCESS_TOKEN` en `.env.local` (o en Vercel, para producción).
3. El **webhook** (`/api/mercadopago/webhook`, que marca el pedido como
   *pagado*) necesita una URL pública — **solo funciona una vez desplegado**,
   no en `localhost`. Configurá la URL del webhook en el panel de Mercado
   Pago apuntando a `https://tu-proyecto.vercel.app/api/mercadopago/webhook`
   (o dejá que Mercado Pago la tome sola del `notification_url` que manda
   cada preferencia — no hace falta configurarla a mano en el panel).
4. El webhook nunca confía en el aviso en sí: vuelve a consultarle a Mercado
   Pago el estado real del pago con nuestro propio `MP_ACCESS_TOKEN` antes de
   marcar cualquier pedido como pagado (`src/lib/mercadopago.ts`,
   `src/app/api/mercadopago/webhook/route.ts`).
5. Checkout Pro ya cubre QR, billetera Mercado Pago y tarjetas en un solo
   flujo — no hace falta una integración de QR de punto de venta separada
   (Bookmist no tiene local físico).

---

## Envíos (costo por zona — Fase 4a)

- El costo de envío se carga a mano por zona en la tabla `zonas_envio`
  (Table Editor de Supabase, hasta que exista el panel de administración de
  la Fase 5). `supabase/seed.sql` trae 3 zonas de ejemplo ("CABA y GBA",
  "Resto de Buenos Aires", "Resto del país") — reemplazalas por las reales.
- El cliente elige su zona en el checkout; el nombre y el costo quedan
  "congelados" en el pedido (`orders.zona_envio`/`orders.costo_envio`), así
  que renombrar o borrar una zona después no afecta pedidos ya hechos.
- **Fase 4b (pendiente)**: integrar la API real de Andreani (cotización
  automática por código postal/peso, generación de etiquetas) cuando
  Bookmist tenga cuenta/contrato comercial con ellos. Hasta entonces, este
  esquema manual por zona es el costo real que se cobra.

---

## Panel de administración (`/admin`)

- **Cajas y kits** (`/admin/productos`): editar precio/stock al instante, o
  entrar a un producto para editar todo, incluido el contenido curado ("qué
  incluye": libros/accesorios elegidos de la biblioteca).
- **Biblioteca de libros y accesorios** (`/admin/items`): los ítems reusables
  que después se eligen para armar el contenido de cada caja/kit.
- **Pedidos** (`/admin/pedidos`): cambiar el estado (pendiente → pagado →
  cancelado) y avisar por WhatsApp. Al confirmar el pago, el stock se
  descuenta de verdad; si un pedido ya pagado se cancela, el stock se repone.
- **Zonas de envío** (`/admin/zonas`): alta/edición/borrado de zonas y costo.
- **Modo reponiendo stock** (`/admin/mantenimiento`): ver más abajo.

### Modo "reponiendo stock"

Tapa el sitio público con una pantalla de "volvemos pronto" (`/mantenimiento`)
en vez del catálogo. Vos seguís viendo el sitio normal mientras tengas la
sesión de admin iniciada (el bypass es la sesión real, no una contraseña
aparte). Se activa de dos formas:

1. **Automático**: cuando ninguna caja/kit visible tiene stock. Se revisa
   cada vez que el stock cambia (pedido pagado/cancelado, o edición manual).
2. **Manual**: con el botón en `/admin/mantenimiento`, para pausar la tienda
   por cualquier otro motivo (vacaciones, mudanza, etc.).

Una activación manual **nunca** se desactiva sola aunque vuelva el stock —
solo Daniela la apaga a mano. El webhook de Mercado Pago (`/api/mercadopago/webhook`)
y el propio panel de administración nunca quedan tapados, para poder seguir
cobrando pagos pendientes y reactivar el sitio.

### CMS de secciones de la home (`/admin/pagina`, Fase 5b)

- La home tiene 7 bloques fijos (portada, beneficios, categorías, más
  vendidos, sobre mí, reseñas, Instagram) guardados en la tabla
  `pagina_secciones`. Desde `/admin/pagina` se puede **arrastrar para
  reordenarlos**, **ocultarlos** individualmente, y **editar su texto**
  (título, bajada, lista de beneficios/reseñas, etc.).
- No es un lienzo libre como en Martín Libros: no se pueden crear tipos de
  bloque nuevos ni duplicar uno existente — el diseño de Dani ya define qué
  bloques hay. Lo editable es el orden, la visibilidad y el contenido de
  texto de cada uno.
- **Si la tabla está vacía** (recién creado el proyecto, o todavía no se
  corrió el seed), la home muestra exactamente el mismo contenido que tenía
  hardcodeado antes de esta fase — nunca se rompe ni queda en blanco (ver
  `src/lib/secciones.ts`).
- El nombre/precio de "Más vendidos" sigue viniendo en vivo de la tabla
  `productos` (marcados como destacados); el CMS solo controla el título y
  la bajada de esa sección, no qué productos aparecen ahí.

---

## Cómo se actualiza el contenido (ISR)

La home, el catálogo, cada ficha de producto y el checkout usan **ISR**
(`export const revalidate = 300`): se sirven como páginas estáticas
(rápidas, cacheables) pero Next las revalida en segundo plano cada 5
minutos. Un cambio de stock, un producto nuevo o una zona de envío editada
en Supabase tarda **hasta 5 minutos** en aparecer en el sitio — no hace
falta redeployar. Sin esto, quedarían fijas desde el momento del build.

---

## Despliegue en Vercel

1. Subí el proyecto a un repositorio de GitHub (privado).
2. En [Vercel](https://vercel.com/new), importá el repositorio (detecta Next.js solo).
3. En **Settings → Environment Variables**, cargá las mismas variables de
   `.env.local` (con `NEXT_PUBLIC_SITE_URL` apuntando a la URL final de Vercel).
4. Deploy. Vercel da una URL `https://tu-proyecto.vercel.app` — no hay
   dominio propio comprado todavía, así que se usa esa URL hasta que se
   compre uno.
5. Actualizá `NEXT_PUBLIC_SITE_URL` con esa URL y volvé a desplegar.

---

## Seguridad (OWASP)

- **RLS en Postgres desde el día 1**: el público solo puede leer productos
  `activo = true`; nada de escritura sin sesión autenticada (ver
  `supabase/migrations/0002_rls.sql`). `orders`/`order_items` no tienen NINGUNA
  política para `anon` — ni lectura ni escritura — los pedidos se crean
  exclusivamente desde `/api/checkout` con la service role key (ver
  `0005_orders_rls.sql`).
- **Validación server-side de precio/stock**: el checkout nunca confía en el
  precio/cantidad que manda el navegador — vuelve a buscar cada producto en la
  base y valida disponibilidad real (stock − reservas de pedidos activos)
  antes de crear el pedido (`src/app/api/checkout/route.ts`).
- **Webhook de Mercado Pago sin confianza ciega**: nunca se marca un pedido
  como pagado por lo que dice el body del webhook — siempre se vuelve a
  consultar el pago por id contra la API real de Mercado Pago con nuestro
  propio access token, así un tercero no puede forjar un aviso de "pago
  aprobado" (`src/lib/mercadopago.ts`).
- **Aislamiento de la service role key**: `src/lib/supabase/admin.ts` está
  marcado `server-only` y nunca se importa desde código de cliente.
- **Admin = cualquier usuario que pueda iniciar sesión**: por eso cerrar el
  registro público en Supabase (paso 6 de la puesta en marcha) no es
  opcional — es la única barrera entre "cualquiera con un email" y el panel
  completo. Todas las server actions del admin (`src/app/admin/**/actions.ts`)
  además revalidan la sesión en cada llamada, no solo en la carga de la página.
- **Modo mantenimiento sin agujero de bypass**: el gate corre en
  `src/lib/supabase/middleware.ts`, junto al refresco de sesión de cada
  request, y solo consulta el estado de mantenimiento cuando el visitante NO
  tiene sesión (una consulta liviana de 2 filas, nunca para el admin
  logueado). Excluye explícitamente `/api/*` para que el webhook de Mercado
  Pago nunca quede bloqueado.
- **Headers de seguridad** en `next.config.ts`: CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  HSTS.
- **CSP sin nonces por ahora** (trade-off documentado en el propio
  `next.config.ts`): se prioriza poder servir las páginas como contenido
  estático/cacheable. Revisado en la Fase 2: el checkout manda sus datos por
  `fetch` a `/api/checkout`, no por navegación de página, así que catálogo/
  carrito/checkout siguen siendo estáticos y el trade-off sigue valiendo.
- **`npm audit`**: hay un advisory moderado conocido (XSS en la copia interna
  de `postcss` que trae `next` como dependencia transitiva). El fix sugerido
  por `npm audit fix --force` degrada Next a la v9 — **no aplicar**; es un
  falso positivo de rango de versiones. Revisar en cada actualización de
  Next.js si ya se resolvió corriente arriba.

---

## Estructura del proyecto

```
supabase/migrations/      Migraciones SQL (esquema, RLS, funciones)
supabase/seed.sql         Datos de ejemplo
design-reference/         Wireframe original de Dani (jsx) + capturas de referencia
src/app/(public)/         Landing, catálogo, carrito, checkout, confirmación de pedido
src/app/admin/            Panel de administración (login, productos, items, pedidos,
                          zonas, modo mantenimiento, secciones de la home)
src/app/mantenimiento/    Pantalla pública de "volvemos pronto"
src/app/api/checkout/     Ruta de creación de pedidos (service role, valida stock real)
src/app/api/mercadopago/  Webhook de confirmación de pago (Checkout Pro)
src/app/robots.ts         SEO: robots.txt
src/app/sitemap.ts        SEO: sitemap.xml (home + catálogo + cada producto activo)
src/components/ui/        Componentes de shadcn/ui
src/components/public/    Componentes propios del sitio público
src/components/admin/     Componentes propios del panel de administración
src/lib/                  Supabase, helpers, formato, slugs, config de marca
src/lib/pedidos.ts        Ajuste de stock compartido (admin + webhook de Mercado Pago)
src/lib/mantenimiento.ts  Lógica del modo "reponiendo stock" (automático + manual)
src/lib/secciones.ts      Secciones editables de la home + su contenido por defecto
src/lib/__tests__/        Tests unitarios (Vitest)
src/types/db.ts           Tipos de la base de datos
src/proxy.ts              Middleware (Next 16 renombró `middleware` a `proxy`)
```

---

## Pendientes antes de salir a producción

Estos ítems no bloquean el desarrollo, pero sí lanzar el sitio real:

- Número de WhatsApp, usuario de Instagram y de TikTok reales.
- Fotos reales de las cajas/kits y de Daniela (hoy hay placeholders).
- Catálogo real de cajas/kits (hoy hay datos de ejemplo en `supabase/seed.sql`).
- Comprar un dominio propio (hoy se usa el subdominio `*.vercel.app`).
- Configurar Resend (o SMTP) si se quiere el aviso de pedidos nuevos por email
  además del link de WhatsApp.
- Zonas de envío y costos reales (hoy hay 3 zonas de ejemplo en
  `supabase/seed.sql`).
- Cuenta/contrato comercial con Andreani para automatizar la cotización real
  (Fase 4b) — hasta entonces, el costo por zona es manual.
- Deshabilitar el registro público en Supabase y crear la cuenta real de
  Daniela (paso 6 de la puesta en marcha) — sin esto, el panel `/admin`
  queda abierto a cualquiera que se registre.

---

## Scripts disponibles

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run start      # correr el build
npm run lint       # ESLint
npm run typecheck  # chequeo de tipos (tsc)
npm run test       # tests unitarios (Vitest)
npm run test:watch # tests en modo watch
```
