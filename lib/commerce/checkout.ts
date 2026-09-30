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
  if (!/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)) return null
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null

  const labels = domain.split('.')
  if (labels.length < 2) return null
  if (labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null
  if (!/^[a-z]{2,63}$/.test(labels.at(-1)!)) return null

  return email
}

export function getEnabledPaymentMethods(config: ThemeConfig): PaymentMethod[] {
  const methods: PaymentMethod[] = []
  if (config.sinpe_number?.trim()) methods.push('sinpe')
  if (config.link_url?.trim()) methods.push('link')
  if (config.cash_instructions?.trim()) methods.push('cash')
  return methods
}

/**
 * Términos por tienda (contrato (g)): si el negocio configuró `terms_url`, el
 * checkout muestra la casilla, enlaza el documento y manda `accepted_terms: true`;
 * `crear_pedido` rechaza el pedido sin ese sí. Solo se aceptan enlaces http(s)
 * absolutos o rutas del propio sitio, para no inyectar un `href` arbitrario.
 */
export function getTermsUrl(config: ThemeConfig): string | null {
  const url = config.terms_url?.trim() ?? ''
  if (!url) return null
  if (url.startsWith('/') && !url.startsWith('//')) return url
  if (!URL.canParse(url)) return null
  const protocol = new URL(url).protocol
  return protocol === 'https:' || protocol === 'http:' ? url : null
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
