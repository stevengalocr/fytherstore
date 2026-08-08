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
- Carrito: estado local persistido en el navegador.
- Checkout: Server Action con precios y stock verificados en servidor.
- Pedidos y tracking: lectura de servidor.
- Aislamiento: todas las operaciones aplicables filtran por `business_id`.
- Seguridad: `SUPABASE_SERVICE_ROLE_KEY` solo se usa en módulos de servidor.

La tienda se activa únicamente cuando son válidas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_BUSINESS_ID`. El checkout también requiere `SUPABASE_SERVICE_ROLE_KEY`.

## Vercel

1. Importa el repositorio en Vercel como un proyecto Next.js.
2. Agrega las cinco variables de `.env.example` en **Settings > Environment Variables**.
3. Usa el dominio final en `NEXT_PUBLIC_SITE_URL`.
4. Despliega y verifica catálogo, variantes, métodos de pago, creación del pedido y tracking contra un negocio de prueba.

No incluyas `.env.local` ni claves reales en Git. Los métodos de pago se muestran únicamente si existen en `theme_config` de BilBildin.

## Comandos de calidad

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

La especificación aprobada está en `docs/superpowers/specs/2026-08-08-fyther-store-v1-design.md` y el contrato visual en `design-system/fyther-store/MASTER.md`.
