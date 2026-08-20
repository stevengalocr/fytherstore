# Fyther Store

Tienda editorial de ropa y accesorios deportivos para Costa Rica, conectada exclusivamente al catálogo y operación comercial de BilBildin.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Sin `.env.local`, la interfaz permanece disponible pero no publica catálogo, precios, checkout ni pedidos. No existen datos comerciales simulados.

## Conexión con BilBildin

La integración usa Supabase como capa de datos de BilBildin:

- Catálogo: lectura pública con revalidación de 60 segundos.
- Marca de producto: BilBildin la entrega desde `products.attributes.brand`.
- Carrito: estado local persistido en el navegador.
- Checkout: Server Action que delega en una RPC transaccional, idempotente y consciente de variantes.
- Pedidos y tracking: lectura de servidor.
- Aislamiento: todas las operaciones aplicables filtran por `business_id`.
- Seguridad: `SUPABASE_SERVICE_ROLE_KEY` solo se usa en módulos de servidor.

La función de pedidos está versionada en `supabase/migrations/202608080001_create_fyther_storefront_order.sql`. Valida tenant, configuración de pago, productos y variantes; crea cliente, pedido, líneas y tracking; descuenta el inventario correcto; y revierte todo ante cualquier fallo.

La tienda se activa únicamente cuando son válidas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_BUSINESS_ID`. El checkout también requiere `SUPABASE_SERVICE_ROLE_KEY`.

Los activos editoriales derivados se preparan desde sus fuentes con:

```bash
node scripts/prepare-fyther-assets.mjs
```

En un clon limpio, las fuentes ignoradas de `.superpowers/generated-assets` pueden no existir. El comando regenera las marcas y posters desde las fuentes públicas disponibles, y conserva las salidas editoriales comprometidas únicamente después de validar su formato y dimensiones; si falta también una salida válida, termina con un error claro.

El hero usa el video local como recorrido controlado por scroll. Con movimiento reducido o ahorro de datos, omite el video y muestra el poster estático sin conservar el tramo de scrub.

## Vercel

1. Importa el repositorio en Vercel como un proyecto Next.js.
2. Agrega las cinco variables de `.env.example` en **Settings > Environment Variables**.
3. Usa el dominio final en `NEXT_PUBLIC_SITE_URL`.
4. Crea primero un despliegue **Preview** y valida contra el tenant configurado de Fyther el catálogo, stock, variantes, métodos de pago, checkout, creación del pedido y tracking.
5. Promueve a **Production** únicamente después de completar esa validación en Preview.

No incluyas `.env.local` ni claves reales en Git. Los métodos de pago se muestran únicamente si existen en `theme_config` de BilBildin.

## Comandos de calidad

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
npm run test:e2e
```

La especificación aprobada está en `docs/superpowers/specs/2026-08-14-fyther-soft-performance-redesign-design.md` y el contrato visual en `design-system/fyther-store/MASTER.md`.
