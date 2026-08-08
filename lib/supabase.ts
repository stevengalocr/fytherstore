import { createClient } from '@supabase/supabase-js'
import { commerceMode } from '@/lib/commerce/config'

export function createPublicClient() {
  if (commerceMode !== 'live') {
    throw new Error('El catálogo live no está configurado.')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export function getBusinessId(): string {
  if (commerceMode !== 'live') {
    throw new Error('El negocio live no está configurado.')
  }
  return process.env.NEXT_PUBLIC_BUSINESS_ID!
}
