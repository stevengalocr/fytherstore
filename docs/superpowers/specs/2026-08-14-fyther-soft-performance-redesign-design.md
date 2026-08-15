# Fyther: rediseño performance editorial suave

## Objetivo

Rediseñar la experiencia completa de Fyther Store para que sea más cómoda, femenina y comercial sin perder su identidad deportiva. La paleta negra con acentos cian y rosa se conserva. La nueva dirección, aprobada como **Performance editorial suave**, combina la precisión de una boutique de marcas deportivas originales con una cercanía cotidiana y social.

La referencia de Lotus Beauty se limita a la claridad de navegación, la separación de mundos comerciales y el ritmo entre inspiración y producto. No se copiarán su identidad, recursos, textos ni composición exacta.

## Criterios de éxito

- La tienda deja de sentirse rígida o formada por una sucesión de rectángulos equivalentes.
- Ropa y Accesorios se entienden como los dos destinos principales desde el primer recorrido.
- El contenido comercial real sigue proviniendo exclusivamente de BilBildin.
- La navegación es clara con mouse, teclado y tacto en móvil, tablet y escritorio.
- El hero ofrece una transición de video breve y memorable sin alargar artificialmente el scroll.
- El sistema visual se aplica también a catálogo, detalle, carrito, checkout, confirmación, seguimiento y páginas informativas.
- Las imágenes editoriales no pueden confundirse con productos disponibles.

## Dirección visual

### Paleta y tono

Se conservan los colores actuales de Fyther:

- Fondo principal negro profundo.
- Superficies elevadas en negro suavemente aclarado.
- Cian para acciones, foco y señales de movimiento.
- Rosa para acentos puntuales, estados destacados y detalles de marca.
- Blanco frío y gris claro para texto.

La interfaz debe sentirse premium, cercana, activa y femenina. No utilizará lenguaje agresivo, estética de fisicoculturismo, decoración botánica, degradados ornamentales ni efectos luminosos excesivos.

### Geometría

Las curvas tendrán jerarquía y función:

- Contenedores editoriales grandes: entre 20 y 24 px.
- Portales de categoría: 24 px con una esquina secundaria de 8 px para introducir asimetría.
- Tarjetas de producto: entre 12 y 16 px.
- Paneles funcionales, formularios y resúmenes: 12 px.
- Botones, filtros y controles compactos: cápsula completa cuando su contenido lo permita.
- Campos de texto y selectores: 12 px, sin convertirlos en cápsulas.

No se aplicará un radio grande de manera indiscriminada. Los productos conservarán una geometría más precisa que las piezas editoriales. No habrá tarjetas dentro de otras tarjetas.

### Tipografía y ritmo

- Los títulos mantienen una voz deportiva fuerte, pero con tamaños ajustados a cada contexto.
- Los textos de soporte serán más ligeros, cortos y con mayor interlineado.
- El ancho de lectura se limitará para evitar párrafos extendidos.
- Las secciones usarán más espacio vertical y variaciones de composición para evitar una cuadrícula monótona.
- No se escalará tipografía en función directa del ancho del viewport.

## Arquitectura de la portada

La portada mantiene este orden:

1. Header flotante.
2. Hero de video controlado por scroll.
3. Línea de confianza y servicio.
4. Portales Ropa y Accesorios.
5. Selección de Ropa.
6. Pausa editorial de comunidad y movimiento.
7. Selección de Accesorios.
8. Preguntas frecuentes.
9. Footer editorial y utilitario.

No se reincorporarán los apartados eliminados `POR QUÉ FYTHER` ni `Lo que sigue, a tu manera.`.

## Header

El header será compacto, fijo y visualmente liviano.

- Escritorio: marca a la izquierda; Ropa, Accesorios y Seguir pedido al centro; bolsa a la derecha.
- Móvil: botón de menú de 44 px, marca centrada y bolsa de 44 px.
- El menú móvil se abre como un panel simple con enlaces de 48 px de alto y cierre visible.
- El contenedor usa fondo oscuro translúcido, borde tenue y radio de cápsula.
- El header reduce ligeramente su altura después del primer desplazamiento sin provocar saltos de layout.
- El foco de teclado será siempre visible en cian.

La marca utilizará una versión con transparencia real; no se simulará transparencia mediante fondos oscuros incrustados.

## Hero y video controlado por scroll

### Recorrido

El video existente se utiliza como una secuencia de entrada de una sola ejecución por carga de la portada.

1. El primer encuadre muestra el mensaje y las acciones principales.
2. El primer desplazamiento inicia el avance del video y retira el texto con opacidad y movimiento corto.
3. El video continúa dentro de una escena fija mientras el usuario recorre una distancia limitada.
4. La reproducción se detiene en `duración del video - 1 segundo`, antes de que la maleta se abra por completo.
5. El encuadre final se funde con los portales Ropa y Accesorios.
6. Una vez completado, el video permanece en el encuadre final y no vuelve a iniciar durante esa carga de página.

### Distancia y control

- Escritorio y tablet horizontal: la escena ocupa `100svh` y el tramo controlado mide `150svh` en total.
- Móvil: la escena ocupa entre `78svh` y `88svh`, y el tramo controlado mide `120svh` en total.
- El avance utiliza `requestAnimationFrame` y una progresión monotónica: retroceder el scroll no reinicia el video.
- No hay loop, sonido, reproducción continua fuera de viewport ni desplazamiento horizontal.
- Los botones del hero son utilizables antes de iniciar el recorrido y permiten saltar directamente a Ropa o Accesorios.

### Alternativas accesibles

- Con `prefers-reduced-motion`, se elimina el control temporal del video y se muestra el póster con una transición breve hacia las categorías.
- Con ahorro de datos, error de carga o reproducción no compatible, se utiliza el mismo póster estático.
- La página mantiene contenido y enlaces funcionales antes de que el video esté listo.
- La animación no depende de audio ni de texto incrustado en el video.

## Línea de confianza

La franja conserva información comercial verificable y lenguaje breve:

- Productos originales.
- Correos de Costa Rica.
- Apartados disponibles.
- Respuesta en menos de 24 horas.

En escritorio funciona como una línea continua. En móvil se presenta en dos filas o desplazamiento nativo corto, sin animación perpetua obligatoria.

La franja se ancla visualmente al borde inferior del hero. Funciona como umbral entre el encuadre final del video y los portales de categoría, sin interrumpir la transición.

## Ropa y Accesorios

### Portales de categoría

- Se presentan exactamente dos portales: Ropa y Accesorios.
- Escritorio: composición de dos columnas con proporciones levemente diferentes y curvas asimétricas complementarias.
- Móvil: rail nativo con scroll snap; una tarjeta completa y parte de la siguiente permanecen visibles.
- Cada portal utiliza una imagen editorial, nombre y acción directa.
- Los estados sin inventario se comunican con texto; nunca se inventan cantidades o disponibilidad.
- Los filtros secundarios solo aparecen cuando existen al menos dos etiquetas reales en BilBildin.

### Selecciones de producto

Ropa y Accesorios tienen una sección propia y la misma jerarquía comercial.

- Escritorio amplio: cuatro productos por fila.
- Escritorio medio: tres productos por fila.
- Tablet: dos productos por fila.
- Móvil: rail nativo con tarjetas del 72% del ancho disponible y una parte de la siguiente visible.
- El orden recibido desde BilBildin se conserva, incluyendo el orden de productos destacados.
- Cada sección termina con un enlace al catálogo ya filtrado.
- Cuando una colección está vacía se muestra un estado editorial breve, sin tarjetas simuladas.

## Tarjetas de producto

La tarjeta de producto prioriza fotografía real y lectura rápida.

- Imagen real con relación 4:5 y dimensiones estables.
- Etiqueta de categoría o marca cuando el dato exista.
- Nombre, precio y precio anterior cuando BilBildin publique un descuento válido.
- Estado agotado visible por texto, no solo por color.
- Toda la tarjeta enlaza al detalle; no se añadirá compra rápida mientras una variante pueda requerir talla, color u otra selección.
- Hover y foco: escala de imagen máxima de 2.5%, borde de acento y desplazamiento de acción de hasta 4 px.
- La interacción no modifica las dimensiones de la tarjeta.

Los nombres Nike, Alo u otras marcas solo aparecen cuando BilBildin los publica como datos de un producto real. No se usarán logotipos de terceros en imágenes generadas.

## Pausa editorial

Entre Ropa y Accesorios habrá una única sección editorial que muestre movimiento cotidiano y comunidad femenina. Será una composición abierta, no una tarjeta flotante.

- Fotografía realista de mujeres adultas en un contexto deportivo social y cercano.
- Sin afirmar que las prendas visibles están disponibles en la tienda.
- Texto breve orientado a bienestar, confianza y compañía.
- Movimiento de entrada con recorte y desplazamiento leve; no utilizará parallax agresivo.

## Preguntas frecuentes

El FAQ conserva el formato de acordeón aprobado.

- Una pregunta abierta a la vez.
- Filas de al menos 56 px en móvil.
- Radios de 14 px, borde tenue y cambio de fondo al abrir.
- Animación de altura y opacidad breve, con alternativa sin movimiento.
- Contenido comercial: originalidad, Correos de Costa Rica, respuesta en menos de 24 horas, apartados y seguimiento.
- No se ofrecerán cambios ni devoluciones que la operación no admita.

## Footer

El footer combina un cierre editorial con navegación utilitaria.

- Escritorio: fotografía panorámica a un lado y contenido al otro.
- Móvil: fotografía superior y enlaces debajo.
- Incluye Ropa, Accesorios, Carrito, Seguimiento, Envíos y apartados, Privacidad, Términos y `fytherstore@gmail.com`.
- Repite de forma compacta Correos de Costa Rica, Sinpe, apartados y respuesta en menos de 24 horas.
- El fondo utiliza la paleta Fyther y no compite con la legibilidad de los enlaces.
- La marca se muestra mediante una variante transparente optimizada.

## Activos visuales

La implementación producirá los siguientes activos:

- `public/brand/fyther-mark-header.webp`: 640 × 640 px, fondo transparente, marca original preservada.
- `public/brand/fyther-mark-footer.webp`: 960 × 960 px, fondo transparente, variante para fondo oscuro.
- `public/editorial/hero-poster-desktop.webp`: 2400 × 1350 px, extraído del primer encuadre estable del video.
- `public/editorial/hero-poster-mobile.webp`: 1200 × 1500 px, recorte vertical coherente con el video.
- `public/editorial/collection-ropa.webp`: 1600 × 2000 px, universo de ropa deportiva femenina premium.
- `public/editorial/collection-accesorios.webp`: 1600 × 2000 px, accesorios deportivos y organización.
- `public/editorial/community-movement.webp`: 2000 × 1200 px, escena social deportiva femenina.
- `public/editorial/footer-movement.webp`: 1800 × 900 px, cierre editorial con espacio negativo para contenido.

Reglas comunes:

- WebP optimizado, salvo que una necesidad de compatibilidad requiera PNG para transparencia.
- Sin texto incrustado, marcas inventadas ni logos de terceros.
- Sin representar imágenes editoriales como fichas de productos comprables.
- `sizes`, ancho, alto o relación de aspecto declarados para evitar saltos de layout.
- Recortes y `object-position` verificados por separado en móvil y escritorio.
- Los activos antiguos dejan de cargarse cuando exista su sustituto, pero no se eliminan hasta confirmar que no tienen consumidores.

## Sistema completo de páginas

La misma dirección se aplicará sin alterar los flujos existentes:

- Catálogo: filtros en cápsula, búsqueda y orden con campos de 12 px, cuadrícula responsiva y estados vacíos claros.
- Detalle: galería 4:5, variantes con selección táctil de 44 px, cantidad, stock y acción principal claramente agrupados.
- Carrito y checkout: superficies de 12 px, resúmenes legibles, errores junto al campo correspondiente y CTA estable.
- Confirmación y tracking: estado principal evidente, número de pedido, eventos y acciones de soporte.
- Políticas y páginas de error: lectura cómoda, navegación coherente y sin tipografía sobredimensionada dentro de paneles compactos.

No se modifica la lógica comercial aprobada de carrito, checkout, pedido o seguimiento salvo los ajustes necesarios para presentar marca y datos normalizados.

## Integración mantenible con BilBildin

### Límite de arquitectura

Los componentes visuales no consultan Supabase ni conocen nombres de tablas. Consumen el contrato `CommerceProduct` a través de la interfaz de comercio existente.

Flujo:

1. La página solicita productos mediante `commerce.getProducts()` o `commerce.getProductBySlug()`.
2. El adaptador BilBildin consulta únicamente el tenant de `NEXT_PUBLIC_BUSINESS_ID`.
3. `mapBilBildinProduct()` transforma filas y variantes al modelo comercial de Fyther.
4. Selectores puros separan Ropa, Accesorios, marcas, etiquetas y destacados.
5. Los componentes reciben datos normalizados y no fabrican contenido comercial.

### Marca y taxonomía

- `CommerceProduct` incorpora `brand: string | null`.
- La marca se obtiene únicamente de `products.attributes.brand` cuando sea una cadena no vacía.
- Si `attributes.brand` no existe, la interfaz omite la marca; no intenta inferirla desde el nombre.
- Ropa y Accesorios se derivan de `category` mediante normalización de mayúsculas, espacios y acentos.
- Etiquetas y `featured` controlan filtros y selecciones sin requerir componentes nuevos.
- Agregar Nike, Alo u otra marca desde BilBildin no exige cambios en la interfaz.

### Actualización, stock y seguridad

- El catálogo conserva revalidación de 60 segundos.
- Precio, variante y stock se vuelven a validar en servidor al confirmar el pedido.
- `SUPABASE_SERVICE_ROLE_KEY` permanece solo en módulos de servidor.
- Toda operación aplicable mantiene el filtro por `business_id`.
- La creación de pedido continúa siendo transaccional e idempotente.
- Las opciones de pago solo se muestran cuando BilBildin las publica en `theme_config`.

### Fallos y estados

- Configuración ausente: se muestra el estado de tienda no configurada existente.
- Error temporal de catálogo: se conserva la portada editorial y se ofrece reintento sin mostrar precios falsos.
- Imagen ausente: se usa un placeholder de marca neutro con relación estable.
- Producto agotado: la ficha permanece consultable, pero la compra queda desactivada.
- Error de video: se utiliza el póster y el usuario accede directamente a las categorías.
- Error de checkout: el carrito se conserva y se comunica una acción concreta para resolverlo.

## Movimiento y microinteracciones

- Entradas de sección de 240 a 420 ms con `opacity`, `transform` o `clip-path` controlado.
- Secuencias escalonadas con diferencias máximas de 80 ms.
- Hover y press entre 120 y 180 ms.
- Ninguna animación continua salvo contenido que se esté reproduciendo por una acción explícita.
- No se animan propiedades que provoquen relayout cuando exista una alternativa con transformaciones.
- El scroll nativo se mantiene en todos los rails.
- `prefers-reduced-motion` elimina el scrub del video, recortes y desplazamientos; conserva solo cambios de estado breves.

## Responsive, accesibilidad y rendimiento

- Objetivos táctiles mínimos de 44 × 44 px.
- Foco visible y orden de teclado coherente.
- Contraste WCAG AA para texto y controles esenciales.
- Compatibilidad con zoom de texto al 200% sin solapamientos.
- Sin scroll horizontal a nivel de página.
- Uso de `svh` para escenas móviles y respeto de safe areas.
- Imágenes servidas con tamaños responsivos, formatos optimizados y carga diferida fuera del primer viewport.
- El póster del hero es prioritario; el video no bloquea el contenido inicial.
- El procesamiento de scroll se limita a un `requestAnimationFrame` activo y se desmonta al salir de la escena.
- La interfaz conserva funcionalidad con JavaScript parcial, video ausente o conexión lenta.

## Verificación

Antes de entregar:

1. Ejecutar lint, typecheck, pruebas unitarias y build de producción.
2. Probar el mapper de marca, categorías, precios, variantes y stock.
3. Probar selección de productos destacados y estados sin inventario.
4. Probar que el video se detiene un segundo antes del final, no hace loop y solo avanza durante el tramo definido.
5. Probar póster alternativo con movimiento reducido, ahorro de datos y error del video.
6. Probar navegación, catálogo, detalle, carrito, checkout, confirmación y tracking con el fixture E2E.
7. Validar capturas a 390 × 844, 768 × 1024 y 1440 × 900 px.
8. Validar zoom al 200%, foco de teclado, contraste y ausencia de scroll horizontal.
9. Verificar que cada activo tenga dimensiones, transparencia y peso correctos, y que no existan medios en blanco.
10. Verificar que productos, precios, descuentos, marcas, stock y variantes visibles provengan de BilBildin.
11. Ejecutar una revisión visual de las transiciones en dispositivo móvil y escritorio.
12. Validar Preview de Vercel con las variables reales antes de promover a Production.

## Fuera de alcance

- Inventar productos, precios, marcas, promociones o existencias.
- Crear logotipos nuevos para Fyther o para marcas de terceros.
- Cambiar políticas comerciales desde la interfaz.
- Modificar el esquema central de BilBildin cuando `attributes.brand`, `category`, `tags` y `featured` cubren el requerimiento.
- Añadir compra rápida para productos que requieren seleccionar una variante.
- Añadir cuentas de usuario, reseñas, favoritos o un sistema CMS independiente.
- Copiar la identidad visual de Lotus Beauty.
