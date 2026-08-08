import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { validateLiveCheckoutConfig } from '@/lib/commerce/checkout'

export function createServiceClient() {
  const config = validateLiveCheckoutConfig(process.env)
  return createClient(config.url, config.serviceRoleKey)
}

export function getServerBusinessId(): string {
  return validateLiveCheckoutConfig(process.env).businessId
}
