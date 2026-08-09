# Fyther Store: Dos mundos

## Objetivo

Reorganizar la tienda con la claridad comercial de Lotus Beauty: una portada que presenta dos mundos, seguida por una sección dedicada para cada uno. Fyther mantendrá una identidad propia, deportiva, femenina, calmada y cercana, con animaciones precisas y sin copiar el lenguaje visual de Lotus.

La navegación principal de compra se dividirá en:

- **Ropa**
- **Accesorios**

La experiencia utilizará exclusivamente productos reales de Supabase. No se crearán productos, precios, existencias ni condiciones comerciales ficticias.

## Audiencia y voz

La tienda se dirige principalmente a mujeres que hacen ejercicio y compran dentro de un entorno cercano de amigas, familia y conocidas. La comunicación debe sentirse segura y activa, pero nunca agresiva o excesivamente competitiva.

Principios de voz:

- Frases cortas, cálidas y claras.
- Movimiento entendido como bienestar y disfrute.
- Confianza basada en información concreta, no en promesas grandilocuentes.
- Español natural para Costa Rica.

## Arquitectura de la portada

1. **Header sutil**: marca, enlaces a Ropa, Accesorios y carrito. El header conserva una presencia ligera y prioriza el contenido.
2. **Hero editorial**: imagen deportiva real, mensaje cercano y acceso directo a ambos mundos.
3. **Franja de servicio**: información breve sobre productos originales, Correos de Costa Rica, apartados y respuesta en menos de 24 horas.
4. **Selector de mundos**: dos piezas visuales grandes, Ropa y Accesorios, con imágenes, texto breve y enlaces a `#ropa` y `#accesorios`.
5. **Sección Ropa**: productos reales cuya categoría normalizada sea `ropa`. Mientras no existan, se mostrará un estado editorial honesto que anuncie la próxima selección, sin tarjetas ni precios inventados.
6. **Transición editorial**: una pausa visual breve que conecte ropa con accesorios y mantenga ritmo de revista.
7. **Sección Accesorios**: productos reales cuya categoría normalizada sea `accesorios`. En el estado actual mostrará los cuatro artículos disponibles en Supabase.
8. **Preguntas frecuentes**: acordeón limpio de una columna, centrado y sin chips informativos separados.
9. **Footer**: navegación, contacto, redes y datos comerciales existentes.

Se elimina por completo la sección final **“Lo que sigue, a tu manera”** y su botón “Ver la colección”. También permanece eliminado el bloque **“Por qué Fyther / Elegimos con intención”**.

## Selector de mundos

El selector traduce la estructura de “dos mundos” de Lotus al lenguaje de Fyther:

- Dos paneles de igual jerarquía en escritorio y apilados en móvil.
- Cada panel muestra el nombre de la categoría como señal principal, una frase de apoyo y una acción clara.
- Las imágenes existentes pueden repetirse temporalmente hasta recibir los recursos definitivos.
- Ropa no se presentará como disponible si no hay inventario; su acción llevará a su estado editorial dentro de la misma página.
- Accesorios llevará directamente a la colección real disponible.

Los enlaces secundarios al catálogo utilizarán filtros explícitos:

- `/catalogo?categoria=Ropa`
- `/catalogo?categoria=Accesorios`

## Mapa de páginas y recorridos

La referencia de Lotus se aplica a la organización comercial, no a una duplicación literal de rutas. Fyther tendrá exactamente dos entradas de colección y conservará únicamente las páginas necesarias para completar una compra:

- `/`: portada con los dos mundos y sus secciones.
- `/catalogo?categoria=Ropa`: colección filtrada de Ropa.
- `/catalogo?categoria=Accesorios`: colección filtrada de Accesorios.
- `/catalogo/[slug]`: detalle de un producto real.
- `/carrito`: revisión del pedido.
- `/checkout`: datos de compra y selección entre SINPE Móvil o efectivo.
- `/confirmacion/[orderId]`: confirmación y acceso al seguimiento.
- `/tracking/[orderId]`: seguimiento privado del pedido confirmado.
- `/envios-apartados`: información de envíos, atención y apartados.
- `/privacidad` y `/terminos`: información legal.

La ruta anterior `/envios-cambios` redirigirá permanentemente a `/envios-apartados`. Se actualizarán todos sus enlaces y textos para no sugerir una política de cambios inexistente. No se crearán páginas promocionales adicionales para cada categoría; los filtros del catálogo son sus vistas dedicadas y mantienen una sola fuente de datos.

## Datos y clasificación

La portada obtiene el catálogo mediante `commerce.getProducts()` y separa los resultados en el servidor.

Reglas de clasificación:

1. Normalizar la categoría con minúsculas, espacios recortados y eliminación de diacríticos.
2. Incluir en Ropa únicamente la categoría normalizada exacta `ropa`.
3. Incluir en Accesorios únicamente la categoría normalizada exacta `accesorios`.
4. No inferir categorías a partir del título, etiquetas o descripción.
5. No duplicar productos entre secciones.
6. Conservar el orden comercial recibido desde la fuente de datos.

Estado inicial esperado:

- **Ropa:** sin productos; muestra estado editorial.
- **Accesorios:** cuatro productos reales existentes.

Si una consulta falla, la página conserva su estructura y presenta un estado discreto, sin exponer errores internos ni sustituirlos por datos falsos.

## Componentes

### `CollectionWorlds`

Selector visual de Ropa y Accesorios. Recibe el estado de disponibilidad de cada mundo para adaptar su microcopy sin alterar la jerarquía visual.

### `CollectionSection`

Componente reutilizable para cada categoría. Recibe título, introducción, productos, ancla y contenido de estado vacío. Reutiliza la tarjeta de producto existente y mantiene dimensiones estables.

### Componentes existentes

- `ProductGrid` se reutiliza o se ajusta para aceptar colecciones ya filtradas.
- `CategoryRail` se elimina o se sustituye por `CollectionWorlds` para evitar navegación duplicada.
- `EditorialStory` se reutiliza únicamente si funciona como transición entre ambos mundos; no debe repetir el selector ni crear otra llamada genérica al catálogo.
- `FinalGlow` se elimina.
- `TrustFaq` se refactoriza como un acordeón FAQ centrado de una sola columna.

## Preguntas frecuentes

El bloque no mencionará cambios ni devoluciones, porque Fyther no ofrece cambios actualmente.

Preguntas y contenido:

1. **¿Los productos son originales?**
   Sí. Fyther trabaja con productos originales y seleccionados de marcas reconocidas.
2. **¿Cómo realizan los envíos?**
   Los pedidos se envían por Correos de Costa Rica. La cobertura y el costo se confirman al coordinar cada compra.
3. **¿Cuánto tardan en responder?**
   Fyther responde consultas y confirma pedidos en menos de 24 horas.
4. **¿Puedo apartar un producto?**
   Sí. Los apartados se coordinan directamente antes de reservar el producto; no se publicarán montos ni plazos que todavía no estén definidos.
5. **¿Cómo consulto mi pedido?**
   Después de confirmar la compra, el cliente recibe el enlace o la información necesaria para dar seguimiento a su pedido.

El acordeón utilizará controles nativos accesibles, estados de foco visibles y permitirá abrir varias respuestas a la vez. La interacción nunca dependerá únicamente del color.

## Dirección visual

- Fondo oscuro sobrio con contraste claro y acentos cian y rosa de la identidad existente.
- Fotografía como señal principal; sin ilustraciones decorativas ni efectos que oculten el producto.
- Tipografía editorial de gran escala solo en hero y transiciones; títulos compactos en producto, navegación y FAQ.
- Bordes finos, radios contenidos y separación generosa.
- La interfaz evita tarjetas dentro de tarjetas y mantiene las secciones como bandas abiertas de página.

## Movimiento

Las animaciones deben aportar orientación y carácter sin ralentizar la compra:

- Entrada progresiva con el sistema `data-reveal` existente.
- Zoom leve y controlado de fotografía al pasar el cursor por cada mundo.
- Desplazamiento corto del indicador de acción al enfocar o activar.
- Transición de opacidad y altura en respuestas del FAQ.
- Rotación del chevron del acordeón.
- Revelado escalonado de productos sin cambios de layout.
- Respeto completo a `prefers-reduced-motion`.

No se usarán rebotes, bucles constantes, parallax agresivo ni animaciones que muevan botones mientras se intenta interactuar con ellos.

## Responsive y accesibilidad

- Escritorio: selector en dos columnas y cuadrícula de productos equilibrada.
- Móvil: selector y productos apilados, con acciones de ancho cómodo y texto sin recortes.
- Imágenes y tarjetas tendrán `aspect-ratio` estable para evitar saltos durante la carga.
- Las anclas compensarán la altura del header.
- Los acordeones usarán semántica nativa `details`/`summary` o una implementación equivalente con teclado y atributos ARIA completos.
- Todas las acciones tendrán foco visible y áreas táctiles de al menos 44 px.
- El contraste cumplirá WCAG AA.

## Vercel y entornos

- `main` seguirá desplegando a Production en `fytherstore.com`.
- Se utilizará una rama estable `staging` como entorno Preview de preproducción.
- `staging` consumirá las variables que ya están configuradas para Preview en Vercel.
- La promoción a producción se realizará integrando cambios verificados en `main`.
- No se dependerá de Custom Environments, porque el proyecto actual está en Hobby y esa capacidad no está disponible en la configuración existente.
- Ninguna clave privada se expondrá en variables `NEXT_PUBLIC_*`, código cliente o historial de Git.

## Verificación

Antes de entregar:

1. Probar la normalización y separación exacta de Ropa y Accesorios.
2. Probar el estado vacío de Ropa y el render de productos reales en Accesorios.
3. Probar contenido, apertura, teclado y foco del FAQ.
4. Confirmar que no aparecen productos inventados ni referencias a cambios.
5. Ejecutar pruebas unitarias, lint y build de producción.
6. Verificar visualmente a 390 px y 1440 px con capturas del navegador.
7. Comprobar que no haya solapamientos, saltos de layout ni texto cortado.
8. Validar navegación, filtros del catálogo, carrito y seguimiento.
9. Desplegar primero en Preview mediante `staging` y validar las variables del entorno.
10. Promover a `main` y confirmar la versión final en `https://www.fytherstore.com/`.

## Fuera de alcance

- Crear productos de Ropa sin datos reales.
- Definir montos o duración de apartados sin una política comercial confirmada.
- Incorporar cambios o devoluciones en el contenido.
- Copiar componentes, textos, imágenes o identidad visual de Lotus Beauty.
