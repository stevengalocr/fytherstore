import { createServiceClient } from '@/lib/supabase-server'
import type { PaymentMethod, ThemeConfig } from '@/lib/types'
import CheckoutClient from './CheckoutClient'

export const metadata = { title: 'Checkout · FYTHER STORE' }
export const revalidate = 300

// Los métodos de pago disponibles salen de theme_config del negocio en BilBildin:
// campo vacío = método no disponible (regla de la referencia técnica §8).
export default async function CheckoutPage() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('businesses')
    .select('theme_config')
    .eq('id', process.env.NEXT_PUBLIC_BUSINESS_ID!)
    .single()

  const config = (data?.theme_config ?? {}) as ThemeConfig

  const methods: Array<{ id: PaymentMethod; label: string; sub: string }> = []
  if (config.sinpe_number) {
    methods.push({
      id: 'sinpe',
      label: 'SINPE Móvil',
      sub: `Transferencia al ${config.sinpe_number}${config.sinpe_name ? ` (${config.sinpe_name})` : ''}`,
    })
  }
  if (config.link_url) {
    methods.push({ id: 'link', label: 'Link de pago', sub: config.link_instructions || 'Recibirás un enlace para pagar en línea' })
  }
  if (config.cash_instructions) {
    methods.push({ id: 'cash', label: 'Efectivo', sub: config.cash_instructions })
  }
  // Salvaguarda: si el negocio aún no configuró métodos, se ofrece efectivo.
  if (methods.length === 0) {
    methods.push({ id: 'cash', label: 'Efectivo', sub: 'El pago se coordina al confirmar el pedido' })
  }

  return <CheckoutClient methods={methods} />
}
