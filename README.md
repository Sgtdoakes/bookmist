# Bookmist 📚✨

Sitio web de **Bookmist**, marca de cajas y kits literarios (libros curados +
accesorios). Este repo cubre, por ahora, las **Fases 1 a 3**: landing pública
conectada a un catálogo real en Supabase, catálogo/carrito/checkout con pago
manual (transferencia/efectivo) y pago online con **Mercado Pago** (Checkout
Pro: QR, billetera y tarjetas en una sola integración). Bookmist envía a todo
el país (sin retiro en persona), así que el checkout siempre pide dirección
de envío; el costo de envío queda "a coordinar" hasta que la Fase 4 automatice
la cotización con Andreani. El panel de administración llega en fases
siguientes — ver el historial de la conversación de planificación para el
roadmap completo.

---

## Stack técnico

- **Next.js 16** (App Router) + **TypeScript** (tipado estricto)
- **Supabase**: base de datos PostgreSQL y storage (Auth se suma en la Fase 5)
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

Después, para cargar cajas/kits de ejemplo (tomados del wireframe de Dani),
ejecutá:

7. [`supabase/seed.sql`](./supabase/seed.sql)

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

Abrí [http://localhost:3000](http://localhost:3000).

> **Nota sobre el panel de administración:** todavía no existe (`/admin`
> llega en la Fase 5, con login de Supabase). Cuando se agregue, va a ser
> obligatorio deshabilitar el registro público en Supabase (**Authentication
> → Sign In / Providers → Allow new users to sign up = OFF**) y crear las
> cuentas de Daniela a mano — el sistema considera admin a cualquier usuario
> que pueda iniciar sesión. Dejarlo anotado acá para no perderlo de vista.

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
| `NEXT_PUBLIC_ENVIO_COSTO` | ⬜ | Costo fijo de envío. Vacío = "a coordinar" (hasta la Fase 4 con Andreani). |
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
src/app/api/checkout/     Ruta de creación de pedidos (service role, valida stock real)
src/app/api/mercadopago/  Webhook de confirmación de pago (Checkout Pro)
src/app/robots.ts         SEO: robots.txt
src/app/sitemap.ts        SEO: sitemap.xml (home + catálogo + cada producto activo)
src/components/ui/        Componentes de shadcn/ui
src/components/public/    Componentes propios del sitio público
src/lib/                  Supabase, helpers, formato, slugs, config de marca
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
- Sin panel de administración todavía (Fase 5): los pedidos se revisan a mano
  desde el **Table Editor de Supabase** (tabla `orders`/`order_items`).

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
