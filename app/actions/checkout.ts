'use server'

// Checkout — punto donde el pedido entra a BilBildin.
// Réplica fiel del createOrder de BilBildin (app/store/actions.ts), con dos
// refuerzos: el business_id se fija desde el entorno (nunca del navegador) y
// el precio de variantes/dúo se verifica contra la base de datos.
import { createServiceClient } from '@/lib/supabase-server'
import { DUO_VARIANT_LABEL, type PaymentMethod } from '@/lib/types'
import { randomBytes } from 'crypto'

const BUSINESS_ID = process.env.NEXT_PUBLIC_BUSINESS_ID!

const PAYMENT_LABELS: Record<string, string> = {
  sinpe: 'SINPE Móvil',
  link:  'Link de Pago',
  cash:  'Efectivo',
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-4)
  const rand = randomBytes(2).toString('hex').toUpperCase()
  return `ORD-${ts}${rand}`
}

export type CheckoutInput = {
  items: Array<{
    product_id: string
    variant_id: string | null
    name: string
    variant_name: string | null
    image: string | null
    price: number
    quantity: number
  }>
  customer: { name: string; email: string; phone: string }
  address: { address: string; city: string; country: string; notes: string }
  paymentMethod: PaymentMethod
}

export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string }

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  try {
    return { ok: true, orderId: await doCreateOrder(input) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al crear el pedido.' }
  }
}

async function doCreateOrder(input: CheckoutInput): Promise<string> {
  const supabase = createServiceClient()

  if (!input.items?.length) throw new Error('El carrito está vacío.')
  if (!input.customer?.name?.trim() || !input.customer?.email?.trim() || !input.address?.address?.trim()) {
    throw new Error('Completa nombre, correo y dirección para continuar.')
  }

  // 0. El negocio debe estar activo (defensa en profundidad).
  const { data: biz } = await supabase
    .from('businesses')
    .select('account_status')
    .eq('id', BUSINESS_ID)
    .single()
  if (!biz || biz.account_status !== 'active') {
    throw new Error('Esta tienda no está aceptando pedidos en este momento.')
  }

  // 1. Validar disponibilidad y stock ANTES de crear el pedido.
  for (const item of input.items) {
    const { data: prod } = await supabase
      .from('products')
      .select('id, name, stock_quantity, status')
      .eq('id', item.product_id)
      .eq('business_id', BUSINESS_ID)
      .single()
    if (!prod || prod.status !== 'visible') {
      throw new Error(`El producto "${item.name}" ya no está disponible.`)
    }
    if (prod.stock_quantity < item.quantity) {
      throw new Error(
        `Stock insuficiente para "${item.name}". Disponible: ${prod.stock_quantity}, solicitado: ${item.quantity}.`
      )
    }
  }

  // 2. Precios y costos reales del servidor — nunca se confía el precio del navegador.
  const productIds = input.items.map(i => i.product_id)
  const { data: productData } = await supabase
    .from('products')
    .select('id, price, cost_price, attributes')
    .in('id', productIds)
    .eq('business_id', BUSINESS_ID)

  const byId = Object.fromEntries((productData ?? []).map(p => [p.id, p]))

  const variantIds = input.items.map(i => i.variant_id).filter((v): v is string => !!v)
  let variantById: Record<string, { id: string; product_id: string; price_modifier: number }> = {}
  if (variantIds.length) {
    const { data: variantData } = await supabase
      .from('product_variants')
      .select('id, product_id, price_modifier')
      .in('id', variantIds)
    variantById = Object.fromEntries((variantData ?? []).map(v => [v.id, v]))
  }

  const orderItems = input.items.map(item => {
    const prod = byId[item.product_id]
    if (!prod) throw new Error(`El producto "${item.name}" ya no está disponible.`)

    // Precio unitario verificado en servidor:
    //  - variante real → price + price_modifier de la BD
    //  - precio dúo    → attributes.duo_price / 2 de la BD
    //  - resto         → price de la BD
    let unitPrice = prod.price
    if (item.variant_id) {
      const variant = variantById[item.variant_id]
      if (!variant || variant.product_id !== item.product_id) {
        throw new Error(`La variante de "${item.name}" ya no está disponible.`)
      }
      unitPrice = prod.price + (variant.price_modifier ?? 0)
    } else if (item.variant_name === DUO_VARIANT_LABEL) {
      const duo = Number((prod.attributes as Record<string, unknown> | null)?.duo_price)
      if (!Number.isFinite(duo) || duo <= 0) {
        throw new Error(`El precio dúo de "${item.name}" ya no está disponible.`)
      }
      unitPrice = duo / 2
    }

    return {
      product_id:    item.product_id,
      variant_id:    item.variant_id ?? null,
      product_name:  item.name + (item.variant_name ? ` — ${item.variant_name}` : ''),
      product_image: item.image ?? null,
      quantity:      item.quantity,
      unit_price:    unitPrice,
      unit_cost:     prod.cost_price ?? 0,
      subtotal:      unitPrice * item.quantity,
    }
  })

  const totalCost        = orderItems.reduce((s, i) => s + i.unit_cost * i.quantity, 0)
  const verifiedSubtotal = orderItems.reduce((s, i) => s + i.subtotal, 0)

  // 3. Upsert / insert del cliente de la tienda.
  let customerId: string | null = null
  const email = input.customer.email.trim().toLowerCase()
  const { data: customer } = await supabase
    .from('store_customers')
    .upsert({
      business_id:  BUSINESS_ID,
      name:         input.customer.name.trim(),
      email,
      phone:        input.customer.phone?.trim() || null,
      auth_user_id: null,
    }, { onConflict: 'business_id,email', ignoreDuplicates: false })
    .select('id, total_orders, total_spent')
    .single()

  customerId = customer?.id ?? null
  if (customer) {
    await supabase.from('store_customers').update({
      total_orders: (customer.total_orders ?? 0) + 1,
      total_spent:  (customer.total_spent ?? 0) + verifiedSubtotal,
    }).eq('id', customer.id)
  }

  // 4. Crear el pedido.
  const orderNumber = generateOrderNumber()
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      business_id:      BUSINESS_ID,
      customer_id:      customerId,
      order_number:     orderNumber,
      status:           'pending',
      subtotal:         verifiedSubtotal,
      total:            verifiedSubtotal,
      total_cost:       totalCost,
      payment_method:   input.paymentMethod,
      payment_status:   'pending',
      shipping_address: {
        name:    input.customer.name.trim(),
        address: input.address.address.trim(),
        city:    input.address.city.trim(),
        country: input.address.country.trim() || 'Costa Rica',
      },
      notes: input.address.notes?.trim() || null,
    })
    .select('id')
    .single()
  if (error || !order) throw new Error(error?.message ?? 'Error al crear el pedido.')

  // 5. Items del pedido.
  await supabase.from('order_items').insert(
    orderItems.map(i => ({ ...i, order_id: order.id }))
  )

  // 6. Decremento atómico de stock (guard .gte evita sobreventa) + inventario.
  for (const item of orderItems) {
    const { data: prod } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .eq('business_id', BUSINESS_ID)
      .single()
    const stockBefore = prod?.stock_quantity ?? 0

    const { data: updated } = await supabase
      .from('products')
      .update({ stock_quantity: stockBefore - item.quantity, updated_at: new Date().toISOString() })
      .eq('id', item.product_id)
      .eq('business_id', BUSINESS_ID)
      .gte('stock_quantity', item.quantity)
      .select('stock_quantity')
      .single()
    const stockAfter = updated?.stock_quantity ?? stockBefore

    await supabase.from('inventory_movements').insert({
      product_id:      item.product_id,
      business_id:     BUSINESS_ID,
      movement_type:   'sale',
      quantity_change: -item.quantity,
      stock_before:    stockBefore,
      stock_after:     stockAfter,
      notes:           `Venta: ${orderNumber}`,
    })
  }

  // 7. Evento inicial de tracking.
  await supabase.from('order_tracking').insert({
    order_id:    order.id,
    status:      'pending',
    title:       'Pedido recibido',
    description: `Gracias ${input.customer.name.trim()}, tu pedido fue registrado. Método de pago: ${PAYMENT_LABELS[input.paymentMethod] ?? input.paymentMethod}.`,
    location:    input.address.city.trim() || null,
  })

  return order.id
}
