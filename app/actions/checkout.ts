'use server'

import { createServiceClient, getServerBusinessId } from '@/lib/supabase-server'
import { normalizeCheckoutEmail } from '@/lib/commerce/checkout'
import { getE2ECommerceFixtureProvider } from '@/lib/commerce/e2e-fixture'
import type { CheckoutInput, CheckoutResult, PaymentMethod } from '@/lib/commerce/types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PAYMENT_METHODS = new Set<PaymentMethod>(['sinpe', 'link', 'cash'])

function customerMessage(error: unknown): string {
  const message = typeof error === 'object' && error && 'message' in error
    ? String(error.message)
    : error instanceof Error ? error.message : ''

  if (message.includes('insufficient_stock')) return 'Una de tus prendas ya no tiene suficiente disponibilidad.'
  if (message.includes('product_unavailable') || message.includes('variant_unavailable')) {
    return 'Una de tus prendas ya no está disponible. Revisa tu carrito.'
  }
  if (message.includes('invalid_payment_method')) return 'El método de pago seleccionado ya no está disponible.'
  if (message.includes('store_not_active')) return 'Esta tienda no está aceptando pedidos en este momento.'
  if (message.includes('invalid_customer_details') || message.includes('invalid_checkout_payload')) {
    return 'Revisa tus datos y vuelve a intentar.'
  }
  if (message.includes('configuración de compra en vivo')) return message
  return 'No pudimos confirmar el pedido. Intenta de nuevo.'
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
      },
    })

    if (error) throw error
    const orderId = typeof data === 'object' && data && 'orderId' in data ? String(data.orderId) : ''
    if (!UUID.test(orderId)) throw new Error('invalid_rpc_response')
    return { ok: true, mode: 'live', orderId }
  } catch (error) {
    return { ok: false, mode: 'live', error: customerMessage(error) }
  }
}
