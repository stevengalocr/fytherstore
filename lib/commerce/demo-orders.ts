import { demoProducts } from '@/lib/commerce/demo'
import type { CheckoutInput, CommerceOrder, CommerceOrderLine } from '@/lib/commerce/types'

function lineFromInput(item: CheckoutInput['items'][number], index: number): CommerceOrderLine {
  const product = demoProducts.find((candidate) => candidate.id === item.productId)
  if (!product || product.availability !== 'in_stock') {
    throw new Error(`El producto "${item.name}" no está disponible en la demostración.`)
  }

  const variant = item.variantId
    ? product.variants.find((candidate) => candidate.id === item.variantId)
    : null
  const stock = variant?.stockQuantity ?? product.stockQuantity
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > stock) {
    throw new Error(`La cantidad solicitada para "${item.name}" no está disponible.`)
  }

  const unitPrice = variant?.price ?? product.price
  return {
    id: `demo-line-${index + 1}`,
    name: variant ? `${product.name} - ${variant.name}` : product.name,
    image: product.images[0]?.src ?? null,
    quantity: item.quantity,
    unitPrice,
    subtotal: { amount: unitPrice.amount * item.quantity, currency: 'CRC' },
  }
}

export function createDemoOrder(input: CheckoutInput, now = new Date()): CommerceOrder {
  if (input.items.length === 0) throw new Error('Agrega al menos un producto al carrito.')
  const lines = input.items.map(lineFromInput)
  const total = lines.reduce((sum, line) => sum + line.subtotal.amount, 0)
  const suffix = input.items.map((item) => item.productId.length + item.quantity).reduce((sum, value) => sum + value, 0)
  const id = `demo-${now.getTime().toString(36)}-${suffix.toString(36)}`

  return {
    id,
    orderNumber: `FY-DEMO-${now.getTime().toString(36).slice(-6).toUpperCase()}`,
    status: 'pending',
    total: { amount: total, currency: 'CRC' },
    createdAt: now.toISOString(),
    paymentMethod: 'demo',
    lines,
    tracking: [{
      id: `${id}-received`,
      status: 'pending',
      title: 'Pedido de demostración recibido',
      description: 'Este recorrido es una simulación. No se realizó ningún cobro ni cambio de inventario.',
      location: input.address.city || null,
      createdAt: now.toISOString(),
    }],
    demo: true,
  }
}
