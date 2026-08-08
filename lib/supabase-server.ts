import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { validateLiveCheckoutConfig } from '@/lib/commerce/checkout'

function getLiveCheckoutConfig() {
  return validateLiveCheckoutConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_BUSINESS_ID: process.env.NEXT_PUBLIC_BUSINESS_ID,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}

export function createServiceClient() {
  const config = getLiveCheckoutConfig()
  return createClient(config.url, config.serviceRoleKey)
}

export function getServerBusinessId(): string {
  return getLiveCheckoutConfig().businessId
}
