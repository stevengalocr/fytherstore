# Fyther Store V1 - Diseño aprobado

## Objetivo

Entregar una tienda Fyther completa, lista para demostración y despliegue, con una identidad editorial de alto rendimiento y un recorrido de compra coherente desde la portada hasta el tracking. La aplicación debe funcionar sin credenciales en modo demo y cambiar a BilBildin al configurar las variables de entorno en Vercel.

## Verdad de producto

Fyther Store es una tienda costarricense de ropa y artículos deportivos originales y de calidad. La marca comunica movimiento, precisión y confianza desde una estética premium sobria. La línea verbal principal es `MOVE DIFFERENT.` y el idioma base es español, con microcopy breve en inglés cuando aporte ritmo.

Fyther controla la experiencia pública. BilBildin sigue siendo la fuente de verdad de productos, variantes, precios, inventario, pedidos, clientes y tracking. Fyther no incluirá un panel administrativo ni duplicará esas responsabilidades.

## Dirección visual

La dirección aprobada es **Revista de alto rendimiento**:

- Superficies Bone `#F4F3EF` y Obsidian `#0B0D0E` alternadas con intención editorial.
- Volt `#B8FF3D` se usa como señal funcional y acento, no como color dominante.
- Graphite `#232628`, Titanium `#A7ADB3` y Pure `#FFFFFF` completan el sistema.
- Archivo se usa para titulares y Manrope para texto e interfaz.
- Composición asimétrica, fotografía amplia, márgenes generosos y datos pequeños de edición o colección.
- Tarjetas con radio máximo de 8 px; controles compactos, claros y con iconografía conocida.
- La imagen y el video locales son materiales de campaña. El video nunca será el recurso LCP ni la única forma de entender el hero.

## Arquitectura de experiencia

### Navegación global

El encabezado será persistente, ligero y accesible. Incluirá marca, acceso a colección/catálogo, manifiesto o sección editorial, búsqueda cuando haya catálogo y carrito con cantidad. En móvil se usará un menú lateral controlado por un botón con icono y etiqueta accesible.

### Home editorial

La portada será una experiencia one-page con estas unidades:

1. `HeroMedia`: poster inmediato, video ambiental progresivo, eyebrow `FYTHER / ACTIVE STORE`, titular `MOVE DIFFERENT.`, texto aprobado y CTA `Shop the drop`.
2. `MotionTrack`: franja editorial breve que comunica movimiento y origen Costa Rica sin hacer afirmaciones comerciales no verificadas.
3. `CategoryRail`: categorías derivadas únicamente del catálogo activo.
4. `FeaturedDrop`: productos destacados reales o el estado honesto `First drop in motion`.
5. `WhyFyther`: propuesta de selección, calidad y experiencia sin promesas operativas inventadas.
6. `EditorialSplit`: imagen de campaña y manifiesto de marca.
7. `TrustBar`: datos verificables obtenidos de configuración o mensajes neutrales.
8. `Faq`: respuestas que no inventan plazos, garantías ni condiciones.
9. `FinalCta` y footer con contacto y enlaces legales.

### Flujo comercial

- `/catalogo`: grilla responsive, filtros por categoría, orden, resultados, estados vacío/error y disponibilidad.
- `/catalogo/[slug]`: galería, precio, precio comparativo cuando sea válido, variantes, cantidad, stock y agregado al carrito.
- `/carrito`: edición de cantidades, eliminación, subtotal y continuidad al checkout. El carrito persiste localmente.
- `/checkout`: contacto, entrega, método de pago y resumen. La interfaz nunca afirma que una tarjeta fue procesada si BilBildin solo coordina el cobro.
- `/confirmacion/[orderId]`: número de pedido, resumen, instrucciones disponibles y acceso al tracking.
- `/tracking/[orderId]`: línea de tiempo de eventos de solo lectura.
- `/privacidad`, `/terminos` y `/envios-cambios`: páginas base transparentes, sin inventar políticas no suministradas; indican el canal de contacto cuando una condición debe confirmarse.

## Capa commerce

La UI consumirá un contrato interno estable y no consultará Supabase directamente desde componentes visuales.

```ts
type CommerceMode = 'demo' | 'live'

type CommerceProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  price: { amount: number; currency: 'CRC' }
  compareAtPrice: { amount: number; currency: 'CRC' } | null
  images: { src: string; alt: string }[]
  availability: 'in_stock' | 'out_of_stock' | 'unavailable'
  stockQuantity: number
  variants: CommerceVariant[]
  category: string | null
  featured: boolean
}
```

`lib/commerce` contendrá dos proveedores:

- `demo`: fixtures aisladas y marcadas visualmente como demostración. Los pedidos se simulan en el navegador y generan confirmación y tracking de prueba sin llamadas de escritura.
- `bilbildin`: catálogo con anon key y operaciones privadas mediante Server Actions con service role.

El selector de proveedor depende de la presencia y validez estructural de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BUSINESS_ID` y, para escritura, `SUPABASE_SERVICE_ROLE_KEY`. La interfaz mostrará un indicador discreto solo en modo demo.

## Reglas BilBildin

1. Toda lectura de catálogo usa anon key, filtra `business_id` y `status = 'visible'`, y nunca solicita `cost_price`.
2. Toda escritura ocurre en servidor con `SUPABASE_SERVICE_ROLE_KEY` y fija `business_id`.
3. El checkout valida negocio activo, productos visibles, variantes y stock, y recalcula precios desde la base.
4. Confirmación y tracking filtran simultáneamente por pedido y `business_id`.
5. Ningún módulo cliente importa el cliente service role.
6. Fyther no edita productos, pedidos, inventario ni tracking.
7. El catálogo real se revalida cada 60 segundos.

La operación real conservará el contrato documentado por BilBildin. Cualquier mejora atómica que requiera una función RPC inexistente se dejará fuera de Fyther hasta que el backend la exponga; no se inventarán endpoints.

## Estados y errores

- `loading`: skeletons con dimensiones finales para evitar saltos.
- `empty`: mensaje editorial y CTA de contacto o retorno; nunca productos falsos en modo live.
- `partial`: fallback tipográfico cuando falta una imagen.
- `out_of_stock`: controles de compra deshabilitados y mensaje explícito.
- `error`: aislamiento por sección en home y recuperación clara en catálogo/checkout.
- `offline/demo`: el usuario entiende que prueba una simulación y que no se realizará un cobro real.
- Errores de checkout preservan carrito y datos del formulario siempre que sea razonable.

## Movimiento y accesibilidad

El sistema usará revelados breves, cambios de sección y desplazamiento editorial con transform y opacity. Las interacciones de interfaz durarán entre 150 y 250 ms. El video se pausará fuera de viewport cuando sea viable.

`prefers-reduced-motion` desactivará desplazamientos, autoplay decorativo y transiciones no esenciales. La navegación completa funcionará con teclado, tendrá foco visible, landmarks correctos, contraste WCAG AA, etiquetas para iconos y áreas táctiles mínimas de 44 px.

## Rendimiento y SEO

- Contenido principal renderizado en servidor.
- Poster optimizado y responsive; el video carga después del contenido crítico.
- Fuentes con `next/font`, sin dependencia crítica de Google Fonts en runtime.
- Metadata por ruta, Open Graph estable, sitemap y robots.
- Datos estructurados de organización solo con información real; `Product` solo para productos live.
- Objetivos: Lighthouse Performance >= 90 y Accessibility, Best Practices y SEO >= 95 en la entrega desplegable.

## Analítica

Se definirá una interfaz sin proveedor que pueda conectar posteriormente Vercel Analytics, GA4 u otra solución. Eventos: `view_home`, `hero_cta_click`, `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout` y `purchase`, con `source_section` y sin PII.

## Estrategia de pruebas

- Pruebas unitarias del selector demo/live, mapeo de productos, formato de moneda, disponibilidad y validación de checkout.
- Pruebas de componentes críticos para estados vacío, sin imagen, agotado y demo.
- Flujo de navegador: home, catálogo, detalle, carrito, checkout demo, confirmación y tracking.
- Verificación visual conjunta en desktop y móvil, incluyendo menú, overflow, legibilidad y reduced motion.
- Comandos finales: lint, typecheck, pruebas y build de producción.

## Criterios de aceptación

- Todo el recorrido comercial comparte la dirección visual aprobada.
- El proyecto funciona de extremo a extremo sin claves en modo demo y no realiza escrituras externas.
- Al configurar las cuatro variables, el catálogo y pedidos usan BilBildin sin cambiar componentes de UI.
- Ningún secreto aparece en bundles, commits, logs de navegador o variables públicas.
- No hay productos, precios, stock, reseñas, descuentos ni políticas inventadas en modo live.
- Los estados loading, empty, partial, error y out of stock son utilizables.
- La experiencia pasa lint, typecheck, pruebas, build y revisión visual desktop/móvil.
- El repositorio incluye `.env.example` y documentación de despliegue en Vercel, pero ninguna credencial real.
