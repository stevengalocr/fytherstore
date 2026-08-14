import { permanentRedirect } from 'next/navigation'

export default function LegacyShippingPage() {
  permanentRedirect('/envios-apartados')
}
