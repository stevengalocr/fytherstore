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

export function validateLiveCheckoutConfig(env: CheckoutEnv): LiveCheckoutConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const businessId = env.NEXT_PUBLIC_BUSINESS_ID
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!present(url) || !URL.canParse(url) || !present(businessId) || !present(serviceRoleKey)) {
    throw new Error('La configuración de compra en vivo está incompleta.')
  }
  return { url, businessId, serviceRoleKey }
}
