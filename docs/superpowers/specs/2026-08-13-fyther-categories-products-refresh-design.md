# Fyther: Renovación de categorías y productos

## Objetivo

Renovar únicamente la exploración de categorías y la presentación de productos de la portada de Fyther. La estructura toma como referencia la claridad del diseño compartido en Claude: categorías visuales, filtros secundarios discretos y una selección comercial inmediata. La implementación conservará la identidad, el contenido y los recorridos ya aprobados de Fyther.

No se copiarán textos, recursos, componentes ni composición exacta del diseño de referencia.

## Alcance

Se modificarán:

- El selector de las categorías Ropa y Accesorios.
- La transición entre el selector y las colecciones.
- La presentación de productos reales en la portada.
- Las imágenes editoriales que representan Ropa y Accesorios.
- Las animaciones relacionadas con estas secciones.

Permanecerán sin cambios:

- Hero y franja de servicio.
- Historia editorial de Fyther.
- Preguntas frecuentes.
- Políticas, navegación legal y footer.
- Diseño y arquitectura del catálogo, detalle de producto, carrito, checkout y seguimiento. El catálogo solo incorporará lectura de la consulta inicial `buscar` para que los filtros editoriales tengan un destino reproducible.
- Integración con BilBildin y Supabase.

## Arquitectura de la sección

### Encabezado

La sección comienza con:

- Eyebrow: `EXPLORA`
- Título: `Encuentra tu movimiento.`
- Texto breve que presenta dos formas de explorar la tienda.

### Categorías principales

El selector contiene exactamente dos destinos:

1. **Ropa**
2. **Accesorios**

Cada categoría utiliza una portada editorial, nombre, estado y acción. Las piezas tienen la misma jerarquía comercial, pero composición y acento diferentes.

Comportamiento:

- En escritorio se presentan como una composición horizontal editorial.
- En tablet y móvil funcionan como un rail táctil con scroll snap.
- La siguiente categoría queda parcialmente visible en móvil para comunicar que el rail puede desplazarse.
- Ropa enlaza a `#ropa`.
- Accesorios enlaza a `#accesorios`.
- Cuando Ropa no tenga inventario real, muestra `Próximamente` y una descripción accesible equivalente.
- Accesorios muestra una acción activa cuando existen productos reales.
- No se inventan cantidades, precios ni disponibilidad.

### Filtros secundarios

Debajo de las categorías principales aparece una fila de filtros compactos solo cuando existan al menos dos etiquetas reales distintas en los accesorios visibles.

Reglas:

- Los filtros provienen exclusivamente de `product.tags` en productos de Accesorios.
- Se recortan espacios, se deduplican sin distinguir mayúsculas y minúsculas y se conserva el orden de primera aparición.
- Se muestran como máximo cinco filtros.
- No se publican filtros vacíos.
- No se muestra una taxonomía ficticia de camisetas, shorts, calzado u otras familias que todavía no existan.
- Cada filtro enlaza a `/catalogo?categoria=Accesorios&buscar=<etiqueta>`.
- El catálogo inicializa su campo de búsqueda con `buscar` y compara la consulta contra nombre, descripción breve y etiquetas del producto.
- En móvil, la fila permite desplazamiento horizontal sin ocultar texto.

## Selección de productos

### Encabezado comercial

- Eyebrow: `SELECCIÓN ACTUAL`
- Título: `Lo que se está llevando.`
- Acción secundaria: `Ver todos los accesorios` hacia `/catalogo?categoria=Accesorios` cuando existan accesorios.

### Datos

La selección utiliza exclusivamente productos reales recibidos de `commerce.getProducts()`.

- Se muestran productos normalizados como `accesorios`.
- Ropa no comparte productos con Accesorios.
- Los productos desconocidos o de categorías diferentes no se fuerzan dentro de estas colecciones.
- El orden comercial recibido desde BilBildin se conserva.
- Las imágenes, nombres, precios, existencias y etiquetas de cada tarjeta provienen de Supabase.

### Cuadrícula

- Escritorio: tres columnas.
- Tablet: dos columnas.
- Móvil: una columna.
- Cuando existan al menos tres productos, la primera tarjeta ocupa dos columnas en escritorio y su imagen usa proporción 8:5; las demás conservan 4:5. Así todas las tarjetas de la primera fila mantienen una altura visual equivalente.
- Con uno o dos productos, o en tablet y móvil, todas las tarjetas usan el mismo ancho y proporción 4:5.
- Las tarjetas mantienen una proporción de imagen estable para evitar saltos de layout.
- No se usan tarjetas anidadas.

### Estado de Ropa

La sección Ropa se mantiene como una pausa editorial honesta mientras no existan productos:

- Título: `Estamos preparando esta selección.`
- No se muestran tarjetas, precios ni badges simulados.
- La portada de Ropa puede verse en el selector porque representa el universo de la categoría, no un producto disponible.

## Tarjetas de producto

La tarjeta conserva `ProductCard` como fuente única de navegación y contenido, con ajustes visuales para la portada:

- Imagen real como elemento principal.
- Categoría, nombre y precio alineados para lectura rápida.
- Acción clara hacia `/catalogo/[slug]`.
- La categoría visible y cualquier etiqueta comercial se derivan únicamente de datos reales; no se generan badges promocionales desde el orden de la cuadrícula.
- El hover amplía la fotografía aproximadamente 2.5%, resalta el borde y desplaza el indicador de acción unos pocos píxeles.
- El foco de teclado ofrece el mismo nivel de claridad que el hover.
- La interacción no cambia dimensiones ni posición de las tarjetas.

## Imágenes editoriales

Se crearán dos imágenes raster originales y optimizadas para web.

### Portada Ropa

- Nombre de archivo: `public/collection-ropa.webp`
- Composición: flat lay premium de activewear femenino negro, leggings y top deportivo, textura textil visible, accesorios mínimos de entrenamiento.
- Luz: cian suave con un acento rosa discreto.
- Fondo: oscuro, limpio y ligeramente táctil.
- Encuadre: espacio negativo suficiente para que la interfaz coloque nombre y estado sin cubrir el producto.
- Tono: cercano, sofisticado y activo; no agresivo.

### Portada Accesorios

- Nombre de archivo: `public/collection-accesorios.webp`
- Composición: selección realista de accesorios deportivos y organizadores, botella, soporte de medallas y pequeños elementos de entrenamiento.
- Luz: lateral cian y rosa equilibrada.
- Fondo: oscuro y limpio, con profundidad controlada.
- Encuadre: producto legible y espacio negativo para la interfaz.
- Tono: útil, coleccionable y contemporáneo.

Restricciones para ambas imágenes:

- Sin texto incrustado.
- Sin logos o marcas inventadas.
- Sin cuerpos deformados ni elementos anatómicos innecesarios.
- Sin representar las portadas como productos comprables.
- Sin sustituir fotografías de productos de Supabase.
- Formato WebP, relación vertical aproximada 4:5 y peso optimizado.

## Movimiento

El selector tendrá una sola firma de movimiento: entrada editorial coordinada.

- El título aparece primero.
- Las portadas se revelan con opacidad y clip suave.
- La segunda categoría tiene un retraso máximo de 90 ms únicamente durante la entrada.
- Al pasar el cursor, la imagen escala de forma leve y el indicador de acción se desplaza.
- Los productos entran en secuencia corta conforme aparecen en viewport.
- El rail móvil conserva scroll nativo y snap; no se añade un carrusel con JavaScript.
- No se utilizan rebotes, parallax agresivo, animaciones continuas ni transiciones de propiedades de layout.

Con `prefers-reduced-motion`, las transformaciones y clips se eliminan. Solo permanecen cambios breves de color u opacidad de hasta 120 ms.

## Responsive y accesibilidad

- Todas las acciones tienen un área táctil mínima de 44 px.
- El rail conserva navegación de teclado y foco visible.
- Los nombres y estados no se recortan con zoom de texto al 200%.
- Las imágenes incluyen texto alternativo editorial, distinto de los nombres de productos.
- El estado `Próximamente` se asocia mediante `aria-describedby` al enlace de Ropa.
- El contenido no depende del color para comunicar disponibilidad.
- Las secciones `#ropa` y `#accesorios` mantienen compensación para el header fijo.
- No aparece scroll horizontal a nivel de página; solo los rails declarados pueden desplazarse.

## Componentes y datos

### `CollectionWorlds`

Se adapta para representar el rail editorial y recibir las portadas generadas. Conserva su interfaz de disponibilidad y sus anclas.

### `CollectionSection`

Mantiene el estado vacío de Ropa. Para Accesorios permite un encabezado comercial y una cuadrícula editorial sin modificar los datos recibidos.

### `ProductCard`

Conserva su contrato público. Los ajustes específicos de portada se aplican mediante clases del contenedor para no alterar el catálogo, carrito o detalle de producto.

### Flujo de datos

1. `app/page.tsx` consulta `commerce.getProducts()`.
2. `splitProductsByWorld()` separa Ropa y Accesorios.
3. El selector recibe la disponibilidad de cada mundo.
4. Los filtros secundarios se derivan de etiquetas reales de Accesorios mediante una función pura y probada.
5. `app/catalogo/page.tsx` valida `buscar` como una cadena única y la entrega como consulta inicial a `CatalogClient`.
6. La sección de Accesorios recibe sus productos sin fabricar ni duplicar datos.
7. Los estados de error y configuración incompleta conservan los mensajes existentes.

## Verificación

Antes de entregar:

1. Probar que Ropa vacía sigue mostrando `Próximamente` y ninguna tarjeta ficticia.
2. Probar que todos los productos de Accesorios provienen del conjunto real recibido.
3. Probar deduplicación, límite y ausencia de filtros cuando haya menos de dos etiquetas distintas.
4. Probar que cada filtro abre el catálogo con categoría y búsqueda inicial correctas, incluyendo etiquetas en la coincidencia.
5. Probar enlaces, nombres accesibles y descripciones de disponibilidad.
6. Verificar visualmente a 390 px, 768 px y 1440 px.
7. Verificar zoom de texto al 200% y `prefers-reduced-motion`.
8. Confirmar que las dos imágenes editoriales cargan, tienen dimensiones estables y no aparecen en tarjetas de producto.
9. Ejecutar pruebas unitarias, lint, typecheck, build y matriz Playwright configurada/sin configurar.
10. Validar con datos reales de Supabase en Preview antes de Production.
11. Confirmar ausencia de solapamientos, recortes, medios en blanco y scroll horizontal de página.

## Fuera de alcance

- Rediseñar hero, historia, FAQ, políticas, footer o checkout.
- Crear productos de Ropa.
- Sustituir imágenes reales del catálogo.
- Copiar la taxonomía ficticia o las políticas comerciales del diseño de referencia.
- Añadir carruseles dependientes de JavaScript.
