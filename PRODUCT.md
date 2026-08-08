# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas en Costa Rica que buscan ropa y artículos deportivos originales y de calidad para un estilo de vida activo. El recorrido principal es descubrir productos, evaluar disponibilidad, comprar y consultar el estado del pedido.

## Product Purpose

Fyther Store presenta la marca y convierte visitas en pedidos. La experiencia pública debe ser rápida, confiable y memorable, mientras BilBildin conserva la administración operativa.

## Positioning

Una selección deportiva costarricense con identidad editorial propia y una experiencia de compra conectada directamente al inventario y los pedidos gestionados en BilBildin.

## Operating Context

El visitante usa la tienda desde móvil o escritorio. El dueño gestiona productos, variantes, precios, stock, pedidos y tracking en BilBildin. Fyther refleja esos datos y crea pedidos, pero no ofrece administración.

## Capabilities and Constraints

- Home editorial, catálogo, detalle, carrito, checkout, confirmación y tracking.
- Catálogo real leído desde Supabase con anon key y filtro obligatorio por `business_id` y `status = 'visible'`.
- Escrituras reales exclusivamente en servidor con service role.
- Sin credenciales, la tienda no publica productos, precios, checkout ni pedidos.
- Moneda CRC.
- La tienda no edita ni cancela productos, pedidos, inventario o tracking.
- No se inventan precios, stock, reseñas, descuentos, políticas ni garantías en modo live.

## Brand Commitments

- Nombre: Fyther Store.
- Línea verbal: `MOVE DIFFERENT.`
- Voz breve, segura, dinámica y elegante. Español base con microcopy corto en inglés.
- Activos locales: `public/home.jpeg` y `public/video-presentacion.mp4`.
- Paleta confirmada: Obsidian, Bone, Volt, Graphite, Titanium y Pure.
- Dirección aprobada: revista de alto rendimiento, calmada, precisa y comercial.

## Evidence on Hand

- Brief, PRD, identidad, motion system y criterios de entrega documentados en Notion.
- Plantilla oficial de integración y documentación técnica del repositorio BilBildin.
- Imagen y video locales de campaña.
- No hay catálogo, reseñas, políticas comerciales ni métricas de negocio confirmadas que deban fabricarse.

## Product Principles

1. BilBildin es la fuente de verdad operativa.
2. No se presentan datos comerciales ficticios cuando BilBildin no está configurado.
3. La marca gana atención con precisión, no con ruido.
4. Cada estado del recorrido debe ser útil y honesto.
5. Seguridad, accesibilidad y rendimiento forman parte del producto.

## Accessibility & Inclusion

La experiencia debe cumplir WCAG AA, funcionar con teclado, conservar foco visible, respetar reduced motion y mantener objetivos táctiles mínimos de 44 px.
