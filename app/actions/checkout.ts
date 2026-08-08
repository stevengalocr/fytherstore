'use server'

import { randomBytes } from 'node:crypto'
import { createServiceClient, getServerBusinessId } from '@/lib/supabase-server'
import { getEnabledPaymentMethods, normalizeCheckoutEmail } from '@/lib/commerce/checkout'
import type { CheckoutInput, CheckoutResult, PaymentMethod, ThemeConfig } from '@/lib/commerce/types'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  sinpe: 'SINPE Móvil',
  link: 'Link de pago',
  cash: 'Efectivo',
}

function orderNumber(): string {
  return `FY-${Date.now().toString(36).slice(-5).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  try {
    if (!input.items.length) throw new Error('Tu carrito está vacío.')
    const email = normalizeCheckoutEmail(input.customer.email)
    if (!input.customer.name.trim() || !email || !input.address.address.trim()) {
      throw new Error('Completa nombre, correo y dirección para continuar.')
    }

    const supabase = createServiceClient()
    const businessId = getServerBusinessId()
    const { data: business, error: businessError } = await supabase
      .from('businesses').select('account_status,theme_config').eq('id', businessId).single()
    if (businessError || business?.account_status !== 'active') {
      throw new Error('Esta tienda no está aceptando pedidos en este momento.')
    }
    const enabledPaymentMethods = getEnabledPaymentMethods((business.theme_config ?? {}) as ThemeConfig)
    if (!enabledPaymentMethods.includes(input.paymentMethod)) {
      throw new Error('El método de pago seleccionado ya no está disponible.')
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))]
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id,name,price,cost_price,stock_quantity,status')
      .in('id', productIds)
      .eq('business_id', businessId)
    if (productError) throw new Error('No pudimos validar los productos.')
    const byProduct = Object.fromEntries((products ?? []).map((product) => [product.id, product]))

    const variantIds = input.items.map((item) => item.variantId).filter((id): id is string => Boolean(id))
    const { data: variants, error: variantError } = variantIds.length
      ? await supabase.from('product_variants').select('id,product_id,name,price_modifier,stock_quantity').in('id', variantIds)
      : { data: [], error: null }
    if (variantError) throw new Error('No pudimos validar las variantes.')
    const byVariant = Object.fromEntries((variants ?? []).map((variant) => [variant.id, variant]))

    const orderItems = input.items.map((item) => {
      const product = byProduct[item.productId]
      if (!product || product.status !== 'visible') throw new Error(`"${item.name}" ya no está disponible.`)
      const variant = item.variantId ? byVariant[item.variantId] : null
      if (item.variantId && (!variant || variant.product_id !== product.id)) throw new Error(`La variante de "${item.name}" ya no está disponible.`)
      const stock = variant?.stock_quantity ?? product.stock_quantity
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || stock < item.quantity) throw new Error(`Stock insuficiente para "${item.name}".`)
      const unitPrice = Number(product.price) + Number(variant?.price_modifier ?? 0)
      return {
        product_id: product.id,
        variant_id: variant?.id ?? null,
        product_name: variant ? `${product.name} - ${variant.name}` : product.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: unitPrice,
        unit_cost: Number(product.cost_price ?? 0),
        subtotal: unitPrice * item.quantity,
        stock_before: stock,
      }
    })

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
    const totalCost = orderItems.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0)
    const { data: customer, error: customerError } = await supabase.from('store_customers').upsert({
      business_id: businessId,
      name: input.customer.name.trim(),
      email,
      phone: input.customer.phone.trim() || null,
      auth_user_id: null,
    }, { onConflict: 'business_id,email', ignoreDuplicates: false }).select('id,total_orders,total_spent').single()
    if (customerError) throw new Error('No pudimos registrar tus datos de compra.')

    if (customer) {
      await supabase.from('store_customers').update({
        total_orders: Number(customer.total_orders ?? 0) + 1,
        total_spent: Number(customer.total_spent ?? 0) + subtotal,
      }).eq('id', customer.id).eq('business_id', businessId)
    }

    const number = orderNumber()
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      business_id: businessId,
      customer_id: customer?.id ?? null,
      order_number: number,
      status: 'pending',
      subtotal,
      total: subtotal,
      total_cost: totalCost,
      payment_method: input.paymentMethod,
      payment_status: 'pending',
      shipping_address: {
        name: input.customer.name.trim(),
        address: input.address.address.trim(),
        city: input.address.city.trim(),
        country: input.address.country.trim() || 'Costa Rica',
      },
      notes: input.address.notes.trim() || null,
    }).select('id').single()
    if (orderError || !order) throw new Error('No pudimos crear el pedido.')

    const { error: itemError } = await supabase.from('order_items').insert(orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      product_image: item.product_image,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      subtotal: item.subtotal,
    })))
    if (itemError) throw new Error('El pedido se creó, pero no pudimos registrar sus productos. Contacta a Fyther.')

    for (const item of orderItems) {
      const stockAfter = item.stock_before - item.quantity
      const { data: updated, error: stockError } = await supabase.from('products')
        .update({ stock_quantity: stockAfter, updated_at: new Date().toISOString() })
        .eq('id', item.product_id)
        .eq('business_id', businessId)
        .gte('stock_quantity', item.quantity)
        .select('stock_quantity')
        .single()
      if (stockError || !updated) throw new Error('El pedido se creó, pero el inventario requiere revisión. Contacta a Fyther.')
      await supabase.from('inventory_movements').insert({
        product_id: item.product_id,
        business_id: businessId,
        movement_type: 'sale',
        quantity_change: -item.quantity,
        stock_before: item.stock_before,
        stock_after: updated.stock_quantity,
        notes: `Venta: ${number}`,
      })
    }

    await supabase.from('order_tracking').insert({
      order_id: order.id,
      status: 'pending',
      title: 'Pedido recibido',
      description: `Tu pedido fue registrado. Método de pago: ${PAYMENT_LABELS[input.paymentMethod]}.`,
      location: input.address.city.trim() || null,
    })
    return { ok: true, mode: 'live', orderId: order.id }
  } catch (error) {
    return { ok: false, mode: 'live', error: error instanceof Error ? error.message : 'No pudimos crear el pedido.' }
  }
}
