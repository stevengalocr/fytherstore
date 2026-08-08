# FYTHER STORE

Tienda en línea de ropa deportiva y accesorios de gimnasio (Costa Rica), conectada al backend **BilBildin**: el catálogo es un espejo en vivo de lo que se gestiona en el admin, y cada pedido de la tienda aparece en ese admin.

- **Stack:** Next.js 15 (App Router) · React 19 · Supabase (BD compartida con BilBildin)
- **Diseño:** FYTHER neon (importado de Claude Design — referencia en `design-source.dc.html`)
- **Integración:** sigue `bilbildin-repo/docs/integraciones/FYTHER.md` al pie de la letra

## Puesta en marcha (una sola vez)

```bash
npm install
npm run provision   # crea el negocio FYTHER en BilBildin, siembra el catálogo,
                    # escribe .env.local e imprime las credenciales del admin
npm run dev         # http://localhost:3000
```

`npm run provision` es idempotente: se puede volver a correr sin duplicar nada.

## Arquitectura de la conexión

```
FYTHER STORE (este repo — diseño libre)
  ├── Catálogo / detalle    → Supabase anon key       (lectura, revalidate 60 s)
  ├── Carrito               → localStorage             (sin backend)
  ├── Checkout              → Server Action            (service_role, SOLO servidor)
  ├── Confirmación          → Server Component         (service_role)
  └── Tracking              → Server Component         (service_role)
            │
       Supabase (la MISMA base de BilBildin) · business_id = NEXT_PUBLIC_BUSINESS_ID
            │
       Admin de BilBildin → productos, precios, stock, pedidos, tracking
```

Reglas inquebrantables (ver plantilla de integración de BilBildin):

1. **Toda** consulta filtra por `business_id` — es la garantía de aislamiento multi-tenant.
2. La `SUPABASE_SERVICE_ROLE_KEY` solo vive en el servidor. Jamás `NEXT_PUBLIC_*`, jamás en git.
3. El catálogo no se hardcodea: se lee en vivo (cambios en el admin se ven sin redeploy).
4. La tienda solo **lee** catálogo y **crea** pedidos. Editar productos, estados y tracking es del admin.

## Convenciones del catálogo (campos `attributes`)

| Campo | Efecto en la tienda |
|---|---|
| `{"custom": true}` | Muestra el personalizador (texto 12 chars + color). La elección viaja en el nombre del ítem del pedido. |
| `{"duo_price": 22000}` | Muestra selector "1 unidad / 2 unidades" con precio especial verificado en servidor. |

Se editan desde el admin de BilBildin (Productos → atributos del producto).

## Despliegue en Vercel

1. Sube este repo a GitHub y créalo como proyecto en Vercel (framework: Next.js, sin config extra).
2. En **Settings → Environment Variables** agrega las 4 variables de `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BUSINESS_ID`, `SUPABASE_SERVICE_ROLE_KEY`).
   La `SUPABASE_SERVICE_ROLE_KEY` márcala solo para el entorno de servidor (no es pública).
3. Deploy. Verifica: catálogo visible → pedido de prueba → aparece en el admin de BilBildin.

## Estructura

```
app/
  page.tsx                     Home (hero + destacados y categorías en vivo)
  catalogo/                    Catálogo con filtros y orden (querystring)
  catalogo/[slug]/             Detalle: variantes, personalización, dúo, stock
  carrito/                     Carrito (localStorage)
  checkout/                    Formulario + métodos de pago desde theme_config
  confirmacion/[orderId]/      Pedido real + instrucciones de pago
  tracking/[orderId]/          Línea de tiempo del pedido (la edita el admin)
  actions/checkout.ts          Server Action createOrder (réplica del oficial de BilBildin)
lib/                           Clientes supabase (anon/service), catálogo, formato
context/CartContext.tsx        Carrito en localStorage
scripts/provision.mjs          Alta + seed + .env.local (npm run provision)
legacy-static/                 Versión estática original (referencia, sin uso)
```
