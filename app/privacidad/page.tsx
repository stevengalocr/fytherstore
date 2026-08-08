import type { Metadata } from 'next'
import PolicyPage from '@/components/site/PolicyPage'

export const metadata: Metadata = { title: 'Privacidad' }

export default function PrivacyPage() {
  return <PolicyPage
    eyebrow="FYTHER / PRIVACIDAD"
    title="Tus datos, con propósito."
    intro="Usamos la información necesaria para procesar pedidos y atender consultas. No vendemos datos personales."
    sections={[
      { title: 'Información que recibimos', content: <p>Al completar un pedido podemos recibir tu nombre, correo, teléfono, dirección, notas de entrega y los productos seleccionados.</p> },
      { title: 'Cómo la usamos', content: <p>La usamos para gestionar el pedido, coordinar pago y entrega, responder consultas y mantener el historial operativo en BilBildin.</p> },
      { title: 'Almacenamiento', content: <p>El carrito se guarda localmente en tu navegador. Los pedidos se almacenan en la infraestructura conectada a BilBildin.</p> },
      { title: 'Tus consultas', content: <p>Puedes solicitar información o correcciones escribiendo a <a href="mailto:stevengalocr@gmail.com">stevengalocr@gmail.com</a>.</p> },
    ]}
  />
}
