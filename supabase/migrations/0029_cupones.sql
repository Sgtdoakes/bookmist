-- =============================================================================
-- Bookmist — Migración 0029: cupones de verdad (Fase 8i)
--
-- Hasta acá había UN solo cupón, guardado como tres claves sueltas en
-- `configuracion` (cupon_bienvenida_*), atado a haberse suscripto al
-- newsletter. Eso no sirve para el caso nuevo: Dani quiere imprimir cupones
-- y dejarlos por el barrio como una búsqueda del tesoro. Ahí cada papelito
-- necesita su PROPIO código y morir apenas alguien lo usa — con un código
-- único repartido en 30 papeles, el primero que lo encuentra se lo lleva y
-- los otros 29 quedan muertos sin que nadie sepa por qué.
--
-- De ahí las columnas:
--   usos_maximos         cuántos pedidos puede descontar. 1 = el del tesoro
--                        (se usa una vez y no sirve más). null = ilimitado.
--   requiere_suscripcion  si hace falta estar en suscriptores_newsletter.
--                         false para los de la calle: el vecino que lo
--                         encuentra no está suscripto, si esto fuera true le
--                         rebotaría siempre.
--   una_vez_por_email     un mismo mail no lo puede repetir. Solo tiene
--                         sentido junto a usos_maximos = null.
--   es_bienvenida         cuál de todos es el que se manda por mail al
--                         suscribirse. Como mucho uno (índice parcial abajo).
--   nota                  para distinguir tandas ("Tesoro barrio 7/8"): con
--                         30 códigos aleatorios en la lista, sin esto no se
--                         sabe cuál es de cuál.
--
-- Los usos NO se llevan en un contador acá: se cuentan sobre
-- orders.cupon_codigo, que ya existe desde la 0026 y es el único registro
-- real de que un cupón se aplicó. Un contador aparte podría desincronizarse
-- del historial de pedidos y ahí no habría forma de saber cuál miente.
-- =============================================================================

create table cupones (
  id                   uuid primary key default gen_random_uuid(),
  codigo               text not null unique,
  pct                  int not null check (pct > 0 and pct <= 100),
  activo               boolean not null default true,
  usos_maximos         int check (usos_maximos is null or usos_maximos > 0),
  requiere_suscripcion boolean not null default false,
  una_vez_por_email    boolean not null default false,
  es_bienvenida        boolean not null default false,
  nota                 text,
  created_at           timestamptz not null default now()
);

-- Como mucho un cupón de bienvenida: el índice solo incluye las filas donde
-- es_bienvenida es true, así que todas las que entran valen `true` y el
-- unique las choca entre sí. Las que están en false ni siquiera se indexan.
create unique index cupones_bienvenida_unico on cupones (es_bienvenida) where es_bienvenida;

-- Se busca por código en cada validación de checkout, siempre en mayúsculas.
create index cupones_codigo_upper_idx on cupones (upper(codigo));

alter table cupones enable row level security;

-- Mismo criterio que suscriptores_newsletter (0026): nada de policies para
-- `anon`. El panel lee y escribe como usuario autenticado; la validación
-- pública (/api/cupon/validar, /api/checkout) pasa por service role, que
-- ignora RLS. Un cupón activo con su porcentaje no es un catálogo público:
-- si `anon` pudiera leer la tabla, cualquiera se baja la lista entera de
-- códigos del tesoro desde la consola del navegador.
create policy "cupones_admin_total"
  on cupones for all
  to authenticated
  using (true)
  with check (true);

-- Migrar el cupón de bienvenida que hoy vive en `configuracion` para que el
-- mail de suscripción siga mandando el mismo código de siempre. Los defaults
-- replican los de getCuponBienvenida() en src/lib/configuracion.ts, para que
-- una instalación que nunca lo configuró quede igual que antes.
do $$
declare
  v_codigo text;
  v_pct    int;
  v_activo boolean;
begin
  select upper(trim(valor)) into v_codigo from configuracion where clave = 'cupon_bienvenida_codigo';
  select nullif(trim(valor), '')::numeric::int into v_pct from configuracion where clave = 'cupon_bienvenida_pct';
  select (valor = 'true') into v_activo from configuracion where clave = 'cupon_bienvenida_activo';

  v_codigo := coalesce(nullif(v_codigo, ''), 'BIENVENIDA10');
  if v_pct is null or v_pct <= 0 or v_pct > 100 then
    v_pct := 10;
  end if;

  insert into cupones (codigo, pct, activo, usos_maximos, requiere_suscripcion, una_vez_por_email, es_bienvenida, nota)
  values (
    v_codigo,
    v_pct,
    coalesce(v_activo, false),
    null,  -- ilimitado en total, pero uno por mail (así funcionaba antes)
    true,
    true,
    true,
    'Se manda por mail a quien se suscribe desde el popup del sitio'
  )
  on conflict (codigo) do nothing;
end $$;

-- Las claves cupon_bienvenida_* quedan en `configuracion` a propósito: ya no
-- las lee nadie, pero borrarlas en la misma migración que las copia dejaría
-- al sitio sin cupón de bienvenida si hubiera que volver atrás el deploy.
-- Se limpian en una migración posterior, cuando esto lleve un tiempo andando.
