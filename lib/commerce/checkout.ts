import type { PaymentMethod, ThemeConfig } from './types'

type CheckoutEnv = Record<string, string | undefined> & Partial<Record<
  'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_BUSINESS_ID' | 'SUPABASE_SERVICE_ROLE_KEY',
  string | undefined
>>

export interface LiveCheckoutConfig {
  url: string
  businessId: string
  serviceRoleKey: string
}

function present(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 3 && !value.includes('<'))
}

export function normalizeCheckoutEmail(value: string): string | null {
  const email = value.trim().toLowerCase()
  if (email.length > 254) return null

  const [local, domain, ...rest] = email.split('@')
  if (!local || !domain || rest.length > 0 || local.length > 64) return null
  if (/\s/.test(email) || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return null

  return email
}

export function getEnabledPaymentMethods(config: ThemeConfig): PaymentMethod[] {
  const methods: PaymentMethod[] = []
  if (config.sinpe_number?.trim()) methods.push('sinpe')
  if (config.link_url?.trim()) methods.push('link')
  if (config.cash_instructions?.trim()) methods.push('cash')
  return methods
}

export function validateLiveCheckoutConfig(env: CheckoutEnv): LiveCheckoutConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const businessId = env.NEXT_PUBLIC_BUSINESS_ID
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!present(url) || !URL.canParse(url) || !present(businessId) || !present(serviceRoleKey)) {
    throw new Error('La configuración de compra en vivo está incompleta.')
  }
  return { url, businessId, serviceRoleKey }
}
