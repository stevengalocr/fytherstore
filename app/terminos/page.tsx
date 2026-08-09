import type { Metadata } from 'next'
import PolicyPage from '@/components/site/PolicyPage'

export const metadata: Metadata = { title: 'Términos' }

export default function TermsPage() {
  return <PolicyPage
    eyebrow="FYTHER / TÉRMINOS"
    title="Una compra clara."
    intro="Estos términos describen el funcionamiento básico de Fyther Store y su conexión comercial con BilBildin."
    sections={[
      { title: 'Catálogo y disponibilidad', content: <p>En modo live, productos, variantes, precios y existencias provienen de BilBildin. La disponibilidad se vuelve a validar en el servidor al confirmar el pedido.</p> },
      { title: 'Fuente comercial', content: <p>Los productos, precios, variantes, disponibilidad y métodos de pago publicados por la tienda provienen de la configuración activa en BilBildin.</p> },
      { title: 'Pedidos reales', content: <p>Un pedido real queda sujeto a confirmación y al método de pago mostrado durante el checkout. No se ofrecen métodos que no estén configurados por el negocio.</p> },
      { title: 'Contacto', content: <p>Para aclaraciones sobre un pedido, escribe a <a href="mailto:fytherstore@gmail.com">fytherstore@gmail.com</a>.</p> },
    ]}
  />
}
