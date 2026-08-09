import type { Metadata } from 'next'
import PolicyPage from '@/components/site/PolicyPage'

export const metadata: Metadata = { title: 'Envíos y cambios' }

export default function ShippingPage() {
  return <PolicyPage
    eyebrow="FYTHER / SERVICIO"
    title="Envíos y cambios, sin letra pequeña."
    intro="Las condiciones concretas se confirman con cada pedido. Esta página no promete plazos, coberturas ni tarifas que todavía no estén configuradas."
    sections={[
      { title: 'Coordinación del envío', content: <p>Después de confirmar un pedido real, Fyther utilizará los datos de contacto proporcionados para coordinar entrega, cobertura y cualquier costo aplicable.</p> },
      { title: 'Seguimiento', content: <p>Cada pedido real incluye una vista de seguimiento. Sus eventos reflejan únicamente las actualizaciones registradas por el equipo en BilBildin.</p> },
      { title: 'Cambios', content: <p>Antes de devolver un artículo, comunícate con Fyther indicando tu número de pedido y el motivo. El equipo confirmará elegibilidad, disponibilidad y pasos aplicables al caso.</p> },
      { title: 'Ayuda', content: <p>Escribe a <a href="mailto:fytherstore@gmail.com">fytherstore@gmail.com</a> para revisar tu pedido.</p> },
    ]}
  />
}
