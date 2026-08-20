import type { Metadata } from 'next'
import PolicyPage from '@/components/site/PolicyPage'

export const metadata: Metadata = { title: 'Términos' }

export default function TermsPage() {
  return <PolicyPage
    eyebrow="FYTHER / TÉRMINOS"
    title="Una compra clara."
    intro="Estos términos describen el funcionamiento básico de Fyther Store y las condiciones de compra."
    sections={[
      { title: 'Catálogo y disponibilidad', content: <p>Los productos, variantes, precios y existencias publicados son los disponibles para esta tienda. La disponibilidad se vuelve a validar al confirmar el pedido.</p> },
      { title: 'Información comercial', content: <p>El catálogo y los métodos de pago se muestran según la disponibilidad actual de la tienda.</p> },
      { title: 'Pedidos reales', content: <p>Un pedido real queda sujeto a confirmación y al método de pago mostrado durante el checkout. Solo se ofrecen los métodos disponibles al momento de comprar.</p> },
      { title: 'Contacto', content: <p>Para aclaraciones sobre un pedido, escribe a <a href="mailto:fytherstore@gmail.com">fytherstore@gmail.com</a>.</p> },
    ]}
  />
}
