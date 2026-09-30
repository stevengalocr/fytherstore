# Fyther Store

Landing propia de **Fyther Store** (tienda deportiva de Costa Rica, CRC; `PRODUCT.md` dice «ropa y artículos deportivos», el catálogo cargado hoy son accesorios de gimnasio y portamedallas personalizables) conectada por código al CORE de **BilBildin**: lee el catálogo con la clave pública y crea pedidos a través de la puerta `create_fyther_storefront_order`, que delega en `crear_pedido`. Next.js 15 (App Router) + React 19 + TypeScript + `@supabase/supabase-js`; Vitest para unidad, Playwright para e2e. En producción en `https://www.fytherstore.com` (Vercel, proyecto `fytherstore`; `fytherstore.com` redirige 308 a `www.`). Estado al 2026-09-30: alineada en código con el contrato de BilBildin (auditoría en el vault); 0 pedidos reales, cobro del plan vencido el 2026-09-08.

- **`business_id`:** `310ff244-02c1-4a53-8ee3-ce4871c38aaa` (UUID público; no es una clave).
- **`PRODUCT.md`** manda en producto y **`DESIGN.md`** en diseño (paleta Night/Neon Cyan/Neon Pink, Barlow Semi Condensed + Manrope, sin gradientes, radio ≤ 8px, motion «Fyther Current»). No se rediseña desde acá. El contrato visual detallado está en `design-system/fyther-store/MASTER.md`.

## Comandos

Orden de verificación antes de cada commit (todo en verde):

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint .
npm test                 # vitest run (unidad + componentes, jsdom; no toca la base)
npm run build            # next build
npm run audit:dead-code  # knip
```

Otros: `npm run dev` (Turbopack, puerto 3000 — ojo, otros proyectos también lo usan), `npm run test:watch`, `npm run test:e2e` (Playwright; levanta dos servidores propios con `FYTHER_E2E_COMMERCE_FIXTURE=live`, es decir **usa un catálogo de fixture en memoria y no toca Supabase**; tarda varios minutos y requiere `npx playwright install`), `npm run assets:icons`.

## Mapa

- `app/` — rutas: `/` (home), `/catalogo`, `/catalogo/[slug]`, `/carrito`, `/checkout`, `/confirmacion/[orderId]`, `/tracking/[orderId]`, legales estáticos (`/terminos`, `/privacidad`, `/envios-cambios`, `/envios-apartados`), `robots.ts`, `sitemap.ts`, `manifest.ts`.
- `app/actions/checkout.ts` — **la única escritura**: Server Action `createOrder` → `rpc('create_fyther_storefront_order', …)` con la llave de servicio. Traduce los códigos de BilBildin a texto del comprador y **devuelve** el error (nunca lo lanza).
- `app/checkout/page.tsx` (servidor) lee `businesses.theme_config` para los métodos de pago y `terms_url`; `CheckoutClient.tsx` es el formulario.
- `lib/supabase.ts` — cliente público (`anon`), solo catálogo. `lib/supabase-server.ts` — cliente de servicio (`server-only`), solo checkout/confirmación/seguimiento.
- `lib/commerce/` — `bilbildin.ts` (lectura de `products` + `product_variants`, columnas enumeradas, `business_id` + `status='visible'`), `orders-server.ts` (lectura de `orders` + `order_items` + `order_tracking`, columnas enumeradas), `mappers.ts`, `checkout.ts` (validaciones puras, `getTermsUrl`), `config.ts` (modo `live` / `unconfigured`), `e2e-fixture.ts` (proveedor en memoria para e2e; inactivo en producción), `types.ts`.
- `context/CartContext.tsx` — carrito en `localStorage`.
- `components/` — UI; `components/commerce/` los estados de comercio y la presentación de pedido.
- `supabase/migrations/202608080001_create_fyther_storefront_order.sql` — **archivo histórico** (ver Trampas).
- `tests/` — Vitest; `tests/actions/checkout.test.ts` fija el contrato del RPC y la traducción de códigos. `e2e/` — Playwright.
- `docs/superpowers/` — specs y planes de diseño (agosto 2026). `docs/vault-sync/` — puente con el vault.
- `legacy-static/` — la landing estática anterior; ignorada por lint y knip.

## Variables de entorno (`.env.example`, sin valores)

| Variable | Dónde vive | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | proyecto Supabase de BilBildin |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | catálogo (`products` visibles) |
| `NEXT_PUBLIC_BUSINESS_ID` | pública | el `business_id` de arriba |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** | checkout, confirmación, seguimiento |
| `NEXT_PUBLIC_SITE_URL` | pública | `metadataBase`, `robots`, `sitemap` |

Sin las tres públicas la tienda queda en modo `unconfigured` (interfaz visible, sin catálogo ni checkout, sin datos ficticios). No hay `.env.local` en este clon; las claves viven en Vercel y (solo si ya estaban documentadas) en `Cuentas-y-Accesos.md` del vault.

## Relación con BilBildin

- BilBildin es la única fuente de verdad de productos, variantes, precios, stock, métodos de pago, pedidos y seguimiento. La tienda **lee catálogo y crea pedidos**; no edita, no cancela, no toca stock.
- El contrato que esta tienda cumple es `../bilbildin/docs/integraciones/CONTRATO-DE-ALINEACION.md` (puntos a–k). La auditoría con evidencia está en el vault: `Tiendas/Fyther-Store/Alineacion-Con-BilBildin.md`.
- Puerta vigente: `create_fyther_storefront_order(uuid, uuid, jsonb)` definida en `../bilbildin/supabase/migrations/20260919_puertas_viejas_delegan.sql`. Delega en `crear_pedido`, **lanza** el código (llega en `error.message`), traduce `invalid_product` → `variant_unavailable`/`product_unavailable` e `invalid_request` → `invalid_checkout_payload`, pasa `accepted_terms` con `coalesce(…, 'false')`, mapea `link` → `card` y pone el prefijo `FY`.
- Códigos que la tienda traduce (`app/actions/checkout.ts`): los ocho de `crear_pedido` (`store_not_active`, `product_unavailable`, `insufficient_stock`, `invalid_product`, `temporarily_unavailable`, `purchase_limit_exceeded`, `invalid_request`, `internal_error`) más `variant_unavailable`, `invalid_checkout_payload`, `invalid_customer_details`, `invalid_payment_method`. Si el CORE agrega un código, se agrega acá con su prueba.

## Reglas que no se rompen

1. **Cero inserts** en `orders`, `order_items`, `order_tracking`, `store_customers`, `inventory_movements`, `storefront_order_requests`. El pedido se pide con `rpc(...)`; el stock lo descuenta la función.
2. `SUPABASE_SERVICE_ROLE_KEY` solo en `lib/supabase-server.ts` (`server-only`) y quien lo importe desde servidor. Nunca con prefijo `NEXT_PUBLIC_`, nunca desde un archivo `'use client'`, nunca devuelta por una ruta. Tras `npm run build`, `grep -rl SUPABASE_SERVICE_ROLE_KEY .next/static` da vacío.
3. Toda consulta lleva `.eq('business_id', …)`; las de catálogo además `.eq('status', 'visible')`; siempre columnas enumeradas (nunca `select('*')`, nunca `cost_price`, `unit_cost`, `total_cost`, `buyer_*`, `changed_by`).
4. Los errores del checkout **se devuelven**, no se lanzan (en producción Next redacta un `Error` lanzado desde una Server Action). El texto al comprador nunca menciona BilBildin, Supabase, «configuración» ni «modo live» (hay pruebas que lo vigilan).
5. Sin datos ficticios en modo live: ni precios, ni stock, ni reseñas, ni promesas de envío. El proveedor de fixture solo existe con `FYTHER_E2E_COMMERCE_FIXTURE=live` y `NODE_ENV !== 'production'`.
6. Cero secretos en commits, `CLAUDE.md`, docs o `vault-sync`. Un `business_id` sí; una clave, nunca.

## Trampas conocidas

- **La migración del repo no es la función que corre.** `supabase/migrations/202608080001_create_fyther_storefront_order.sql` es la implementación original (2026-08-08, escribía tablas por su cuenta). Desde el 2026-09-19 la función con ese nombre es la puerta del CORE que delega en `crear_pedido`; la copia vieja se borró el 2026-09-24. El archivo se conserva como historia y contrato; **lo que manda es el repo `bilbildin`**. Si hay que cambiar la puerta, se cambia allá.
- **Los tildes del seguimiento** (`recibió`) se rompieron al aplicar la migración original en la base, no en el archivo; la puerta del CORE los corrigió. La tienda renderiza el texto tal cual llega (React/UTF-8): no lo «arregla» ni lo transforma.
- **`link` en la tienda es `card` en la base.** La puerta hace `link → card` al crear y `orders-server.ts` hace `card → link` al leer. Un método nuevo requiere tocar los dos lados y `getEnabledPaymentMethods`.
- **La tienda no lee `attributes.drop` ni `attributes.max_per_order`** (pendiente del contrato, punto b): la disponibilidad se deduce solo del stock. `crear_pedido` sí los aplica y responde `product_unavailable` / `purchase_limit_exceeded`, que la tienda traduce; el comprador puede ver «disponible» y recibir ese rechazo al confirmar.
- **Puerto 3000 compartido** con otros proyectos de la carpeta; antes de dar por bueno un `localhost:3000`, confirmar que es Fyther.
- **`next start` sirve el build viejo**: una ruta nueva da 404 hasta rehacer `npm run build`.
- **e2e:** no lo corras si no tenés los navegadores de Playwright; no toca la base pero levanta servidores y copia el repo a `%TEMP%`.

## Vault de Obsidian (memoria del proyecto) — protocolo de alineación

El estado, la auditoría contra el contrato, la marca/catálogo, las cuentas y los pendientes de esta tienda viven fuera del repo, en el vault local de Obsidian:

- **Sub-nodo Fyther-Store:** `..\obsidian\Cerebro2.0\02-Proyectos\BilBildin\Tiendas\Fyther-Store\` — `Fyther-Store.md` (hub), `Alineacion-Con-BilBildin.md`, `Integracion-Y-Estado.md`, `Arquitectura-Y-Codigo.md`, `Marca-Y-Catalogo.md`, `Rendimiento-SEO-Y-Pendientes.md`, `Cuentas-y-Accesos.md` (credenciales: solo ahí, nunca acá), `Pendientes.md`, `index.md`, `log.md`.
- **Nodo padre:** `..\obsidian\Cerebro2.0\02-Proyectos\BilBildin\` (hub, `Contrato-De-Alineacion-De-Tiendas.md`, `Pendientes.md`). Constitución del vault: `..\obsidian\Cerebro2.0\CLAUDE.md`; protocolo completo: `..\obsidian\Cerebro2.0\00-Sistema\Protocolo-Repo-Vault.md`.

**Toda unidad de trabajo que cambie código, estado, decisiones o seguridad deja el vault al día.** El repo lleva un archivo puente que después se aplica al vault tal cual:

- Archivo: `docs/vault-sync/AAAA-MM-DD-<tema>.md` (uno por sesión o loop; se versiona).
- Un bloque por unidad de trabajo, con este formato exacto:
  ```
  ### <ID> · <título> · commit <hash> · despliegue <estado|n/a>
  **Pendientes.md** — ítems a cerrar e ítems nuevos.
  **Decisiones.md** — decisiones nuevas en ADR corto, o "ninguna".
  **Seguridad.md** — hallazgos que cambian de estado, o "sin cambios".
  **Otras páginas** — qué frase queda desactualizada en qué página y el texto nuevo.
  **log.md** — `## [AAAA-MM-DD] ingest | <título>` + 3-6 viñetas.
  Aplicado en vault: sí | no
  ```
  (Este sub-nodo no tiene `Decisiones.md` ni `Seguridad.md` propios: lo que corresponda va a `Pendientes.md`, `Integracion-Y-Estado.md` o `Alineacion-Con-BilBildin.md`, y lo que sea del CORE se anota como pendiente para BilBildin.)
- **Sesión local** (con el vault a mano): aplica el bloque directo a las páginas del sub-nodo, corre `node ..\obsidian\Cerebro2.0\00-Sistema\scripts\lint-vault.mjs 02-Proyectos/BilBildin/Tiendas/Fyther-Store Fyther-Store` desde la raíz del vault hasta `0 problemas`, y marca `Aplicado en vault: sí` en el mismo commit. **Sesión en la nube:** deja `no`; la próxima sesión local lo aplica al recibir «sincronizá el vault».
- **Una unidad sin su bloque de `vault-sync` no está terminada.**
- Fin de línea: `.gitattributes` fuerza LF y `core.autocrlf=false`; antes de cada `git add`, `git diff --stat --ignore-cr-at-eol` tiene que mostrar solo cambios reales (un commit no puede contener cambios que sean solo CRLF↔LF).
- Nunca se copian credenciales del vault al repo ni al `vault-sync`: se nombran («la llave de servicio»), no se escriben.
- Contrato que esta tienda cumple: `../bilbildin/docs/integraciones/CONTRATO-DE-ALINEACION.md`. Un cambio del CORE que toque un punto del contrato abre un pendiente acá.
