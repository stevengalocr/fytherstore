import type { Metadata } from 'next'
import { commerceMode } from '@/lib/commerce'
import { createServiceClient, getServerBusinessId } from '@/lib/supabase-server'
import type { ThemeConfig } from '@/lib/commerce/types'
import CheckoutClient, { type PaymentOption } from './CheckoutClient'
import CommerceState from '@/components/commerce/CommerceState'

export const metadata: Metadata = { title: 'Checkout' }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  if (commerceMode === 'unconfigured') return <CommerceState state="unconfigured" />

  let methods: PaymentOption[] = []
  try {
    const { data } = await createServiceClient().from('businesses').select('theme_config').eq('id', getServerBusinessId()).single()
    const config = (data?.theme_config ?? {}) as ThemeConfig
    if (config.sinpe_number) methods.push({ id: 'sinpe', label: 'SINPE Móvil', description: `Transferencia al ${config.sinpe_number}` })
    if (config.link_url) methods.push({ id: 'link', label: 'Link de pago', description: config.link_instructions || 'Recibirás las instrucciones al confirmar' })
    if (config.cash_instructions) methods.push({ id: 'cash', label: 'Efectivo', description: config.cash_instructions })
  } catch { methods = [] }

  return <CheckoutClient methods={methods} />
}
