import { describe, expect, it } from 'vitest'
import { hasLiveCheckoutConfig, resolveCommerceMode } from '@/lib/commerce/config'

const livePublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
  NEXT_PUBLIC_BUSINESS_ID: '11111111-1111-4111-8111-111111111111',
}

describe('commerce configuration', () => {
  it('uses demo mode when public credentials are missing', () => {
    expect(resolveCommerceMode({})).toBe('demo')
  })

  it('uses live mode when public credentials are structurally valid', () => {
    expect(resolveCommerceMode(livePublicEnv)).toBe('live')
  })

  it('keeps placeholder values in demo mode', () => {
    expect(resolveCommerceMode({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '<anon key>',
      NEXT_PUBLIC_BUSINESS_ID: '<business id>',
    })).toBe('demo')
  })

  it('requires the private key before enabling live checkout', () => {
    expect(hasLiveCheckoutConfig(livePublicEnv)).toBe(false)
    expect(hasLiveCheckoutConfig({
      ...livePublicEnv,
      SUPABASE_SERVICE_ROLE_KEY: 'private-service-key',
    })).toBe(true)
  })
})
