// Cliente público (anon key) — seguro en el navegador. Solo lectura de catálogo.
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Clave de aislamiento multi-tenant: TODA consulta filtra por este ID.
export const BUSINESS_ID = process.env.NEXT_PUBLIC_BUSINESS_ID!
