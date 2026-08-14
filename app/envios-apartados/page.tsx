import type { Metadata } from 'next'
import PolicyPage from '@/components/site/PolicyPage'

export const metadata: Metadata = { title: 'Envíos y apartados' }

export default function ShippingLayawayPage() {
  return <PolicyPage
    eyebrow="FYTHER / SERVICIO"
    title="Envíos y apartados, con claridad."
    intro="La cobertura, el costo del envío y las condiciones de los apartados se confirman para cada pedido."
    sections={[
      { title: 'Correos de Costa Rica', content: <p>El envío se realiza por Correos de Costa Rica. La cobertura y el costo se coordinan para cada pedido.</p> },
      { title: 'Apartados', content: <p>Los apartados están disponibles y sus condiciones se acuerdan antes de reservar el producto.</p> },
      { title: 'Seguimiento', content: <p>Cada pedido confirmado incluye una vista única de seguimiento que refleja las actualizaciones registradas en BilBildin.</p> },
      { title: 'Ayuda', content: <p>Escribe a <a href="mailto:fytherstore@gmail.com">fytherstore@gmail.com</a>. Respondemos en menos de 24 horas.</p> },
    ]}
  />
}
