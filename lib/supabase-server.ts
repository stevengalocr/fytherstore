// Cliente privado (service_role) — SOLO servidor.
// Importar únicamente desde Server Actions / Server Components.
// NUNCA desde un componente 'use client'.
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
