import { createClient } from '@supabase/supabase-js'
import { resolveCommerceMode } from '@/lib/commerce/config'

export function createPublicClient() {
  if (resolveCommerceMode(process.env) !== 'live') {
    throw new Error('El catálogo live no está configurado.')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export function getBusinessId(): string {
  if (resolveCommerceMode(process.env) !== 'live') {
    throw new Error('El negocio live no está configurado.')
  }
  return process.env.NEXT_PUBLIC_BUSINESS_ID!
}
