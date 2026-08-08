import type { CommerceMode } from '@/lib/commerce/types'

type CommerceEnv = Record<string, string | undefined> & Partial<Record<
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  | 'NEXT_PUBLIC_BUSINESS_ID'
  | 'SUPABASE_SERVICE_ROLE_KEY',
  string | undefined
>>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isRealValue(value: string | undefined): value is string {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized.length > 3 && !normalized.includes('<') && !normalized.includes('placeholder')
}

export function resolveCommerceMode(env: CommerceEnv): CommerceMode {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  if (!isRealValue(url) || !URL.canParse(url)) return 'unconfigured'
  if (!isRealValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) return 'unconfigured'
  if (!UUID.test(env.NEXT_PUBLIC_BUSINESS_ID ?? '')) return 'unconfigured'
  return 'live'
}

export function hasLiveCheckoutConfig(env: CommerceEnv): boolean {
  return resolveCommerceMode(env) === 'live' && isRealValue(env.SUPABASE_SERVICE_ROLE_KEY)
}

export const commerceMode = resolveCommerceMode({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_BUSINESS_ID: process.env.NEXT_PUBLIC_BUSINESS_ID,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
})
