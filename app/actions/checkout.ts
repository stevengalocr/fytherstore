'use server'

import { createServiceClient, getServerBusinessId } from '@/lib/supabase-server'
import { normalizeCheckoutEmail } from '@/lib/commerce/checkout'
import { getE2ECommerceFixtureProvider } from '@/lib/commerce/e2e-fixture'
import type { CheckoutInput, CheckoutResult, PaymentMethod } from '@/lib/commerce/types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PAYMENT_METHODS = new Set<PaymentMethod>(['sinpe', 'link', 'cash'])

/**
 * Traduce los códigos públicos del alta de pedido de BilBildin a texto para el
 * comprador. Son los ocho de `crear_pedido` (`bilbildin/lib/errores-pedido.ts`)
 * más los nombres propios que la puerta `create_fyther_storefront_order`
 * traduce para esta tienda: `invalid_product` → `variant_unavailable` /
 * `product_unavailable`, `invalid_request` → `invalid_checkout_payload`, y
 * `invalid_payment_method` / `invalid_customer_details`, que la puerta valida
 * antes de delegar. La puerta **lanza** el código (llega en `error.message`);
 * `crear_pedido` directo lo **devuelve** en `data.code`. Se aceptan las dos formas.
 *
 * Solo `temporarily_unavailable` invita a reintentar; `internal_error` cae a
 * propósito al mensaje genérico, sin explicar la causa.
 */
const CUSTOMER_MESSAGES: ReadonlyArray<readonly [codes: readonly string[], message: string]> = [
  [['insufficient_stock'], 'Una de tus prendas ya no tiene suficiente disponibilidad.'],
  [['purchase_limit_exceeded'], 'Una de tus prendas supera la cantidad máxima por pedido. Reduce la cantidad e intenta de nuevo.'],
  [['product_unavailable', 'variant_unavailable', 'invalid_product'], 'Una de tus prendas ya no está disponible. Revisa tu carrito.'],
  [['invalid_payment_method'], 'El método de pago seleccionado ya no está disponible.'],
  [['store_not_active'], 'Esta tienda no está aceptando pedidos en este momento.'],
  [['temporarily_unavailable'], 'No pudimos confirmar el pedido en este momento. Espera unos segundos e intenta de nuevo.'],
  [['invalid_customer_details', 'invalid_checkout_payload', 'invalid_request'], 'Revisa tus datos y vuelve a intentar.'],
]
const GENERIC_MESSAGE = 'No pudimos confirmar el pedido. Intenta de nuevo.'

function customerMessage(error: unknown): string {
  const message = typeof error === 'object' && error && 'message' in error
    ? String(error.message)
    : error instanceof Error ? error.message : ''

  for (const [codes, text] of CUSTOMER_MESSAGES) {
    if (codes.some((code) => message.includes(code))) return text
  }
  return GENERIC_MESSAGE
}

function validateInput(input: CheckoutInput): { email: string } {
  if (!UUID.test(input.idempotencyKey)) throw new Error('invalid_checkout_payload')
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 20) {
    throw new Error('invalid_checkout_payload')
  }
  for (const item of input.items) {
    if (!UUID.test(item.productId) || (item.variantId !== null && !UUID.test(item.variantId))) {
      throw new Error('invalid_checkout_payload')
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 8) {
      throw new Error('invalid_checkout_payload')
    }
  }

  const email = normalizeCheckoutEmail(input.customer.email)
  const name = input.customer.name.trim()
  const phone = input.customer.phone.trim()
  const address = input.address.address.trim()
  const city = input.address.city.trim()
  const country = input.address.country.trim()
  const notes = input.address.notes.trim()
  if (!name || name.length > 140 || phone.length > 24 || !email || !address || address.length > 300
    || city.length > 120 || country.length > 80 || notes.length > 500) {
    throw new Error('invalid_customer_details')
  }
  if (!PAYMENT_METHODS.has(input.paymentMethod)) throw new Error('invalid_payment_method')
  return { email }
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  try {
    const { email } = validateInput(input)
    const fixtureProvider = getE2ECommerceFixtureProvider()
    if (fixtureProvider) {
      const orderId = await fixtureProvider.createOrder({
        ...input,
        customer: {
          ...input.customer,
          name: input.customer.name.trim(),
          email,
          phone: input.customer.phone.trim(),
        },
      })
      return { ok: true, mode: 'live', orderId }
    }
    const businessId = getServerBusinessId()
    const { data, error } = await createServiceClient().rpc('create_fyther_storefront_order', {
      p_business_id: businessId,
      p_idempotency_key: input.idempotencyKey,
      p_payload: {
        items: input.items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
        customer: {
          name: input.customer.name.trim(),
          email,
          phone: input.customer.phone.trim(),
        },
        shipping_address: {
          address: input.address.address.trim(),
          city: input.address.city.trim(),
          country: input.address.country.trim() || 'Costa Rica',
          notes: input.address.notes.trim(),
        },
        payment_method: input.paymentMethod,
        // Solo viaja el sí del comprador; la versión de términos la pone BilBildin
        // (`terms_version` sale de `theme_config`, nunca del navegador).
        accepted_terms: input.acceptedTerms === true,
      },
    })

    if (error) throw error
    if (typeof data === 'object' && data && 'code' in data) throw new Error(String(data.code))
    const orderId = typeof data === 'object' && data && 'orderId' in data ? String(data.orderId) : ''
    if (!UUID.test(orderId)) throw new Error('invalid_rpc_response')
    return { ok: true, mode: 'live', orderId }
  } catch (error) {
    return { ok: false, mode: 'live', error: customerMessage(error) }
  }
}
