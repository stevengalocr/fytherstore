import 'server-only'
import type {
  CheckoutInput,
  CommerceOrder,
  CommerceProduct,
  PaymentMethod,
} from '@/lib/commerce/types'

const ORDER_ID = '40000000-0000-4000-8000-000000000001'
const ORDER_LINE_ID = '50000000-0000-4000-8000-000000000001'
const TRACKING_EVENT_ID = '60000000-0000-4000-8000-000000000001'

type FixtureState = {
  idempotencyKeys: Map<string, string>
  orders: Map<string, CommerceOrder>
}

type FixtureGlobal = typeof globalThis & {
  __FYTHER_E2E_COMMERCE_STATE__?: FixtureState
}

export type FixtureCheckoutMethod = {
  id: PaymentMethod
  label: string
  description: string
}

export type E2ECommerceFixtureProvider = {
  commerce: typeof e2eFixtureCommerce
  checkoutMethods: FixtureCheckoutMethod[]
  createOrder(input: CheckoutInput): Promise<string>
  readOrder(orderId: string): Promise<CommerceOrder | null>
}

const fixtureProducts: CommerceProduct[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    slug: 'accesorio-fyther-uno',
    name: 'Accesorio Fyther Uno',
    brand: 'Nike',
    shortDescription: null,
    description: null,
    price: { amount: 15000, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/ropa.png', alt: 'Accesorio Fyther Uno' }],
    availability: 'in_stock',
    stockQuantity: 5,
    variants: [
      {
        id: '20000000-0000-4000-8000-000000000001',
        name: 'Rosa',
        sku: 'E2E-UNO-ROSA',
        price: { amount: 15000, currency: 'CRC' },
        stockQuantity: 3,
        attributes: { color: 'Rosa' },
        images: [{ src: '/ropa.png', alt: 'Accesorio Fyther Uno en rosa' }],
      },
      {
        id: '20000000-0000-4000-8000-000000000002',
        name: 'Cian',
        sku: 'E2E-UNO-CIAN',
        price: { amount: 16000, currency: 'CRC' },
        stockQuantity: 2,
        attributes: { color: 'Cian' },
        images: [{ src: '/ropa.png', alt: 'Accesorio Fyther Uno en cian' }],
      },
    ],
    category: 'Accesorios',
    tags: ['Botellas', 'Gym'],
    featured: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    slug: 'accesorio-fyther-dos',
    name: 'Accesorio Fyther Dos',
    brand: 'Alo',
    shortDescription: null,
    description: null,
    price: { amount: 18000, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/modelo2.png', alt: 'Accesorio Fyther Dos' }],
    availability: 'in_stock',
    stockQuantity: 1,
    variants: [],
    category: 'Accesorios',
    tags: ['Gym', 'Organización'],
    featured: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    slug: 'accesorio-fyther-tres',
    name: 'Accesorio Fyther Tres',
    brand: null,
    shortDescription: 'Un detalle para tu rutina diaria',
    description: null,
    price: { amount: 12000, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/home.jpeg', alt: 'Accesorio Fyther Tres' }],
    availability: 'in_stock',
    stockQuantity: 2,
    variants: [],
    category: 'Accesorios',
    tags: ['Regalos'],
    featured: false,
  },
]

export const e2eFixtureCommerce = {
  async getProducts(): Promise<CommerceProduct[]> {
    return [...fixtureProducts]
  },

  async getProductBySlug(slug: string): Promise<CommerceProduct | null> {
    return fixtureProducts.find((product) => product.slug === slug) ?? null
  },
}

function fixtureState(): FixtureState {
  const fixtureGlobal = globalThis as FixtureGlobal
  fixtureGlobal.__FYTHER_E2E_COMMERCE_STATE__ ??= {
    idempotencyKeys: new Map(),
    orders: new Map(),
  }
  return fixtureGlobal.__FYTHER_E2E_COMMERCE_STATE__
}

function cloneOrder(order: CommerceOrder): CommerceOrder {
  return structuredClone(order)
}

async function createFixtureOrder(input: CheckoutInput): Promise<string> {
  if (input.paymentMethod !== 'cash') throw new Error('invalid_payment_method')
  const state = fixtureState()
  const existingOrderId = state.idempotencyKeys.get(input.idempotencyKey)
  if (existingOrderId) return existingOrderId

  const lines = input.items.map((item, index) => {
    const product = fixtureProducts.find(({ id }) => id === item.productId)
    if (!product || product.availability !== 'in_stock') throw new Error('product_unavailable')
    const variant = item.variantId
      ? product.variants.find(({ id }) => id === item.variantId)
      : null
    if (product.variants.length > 0 && !variant) throw new Error('variant_unavailable')
    const stockQuantity = variant?.stockQuantity ?? product.stockQuantity
    if (item.quantity > stockQuantity) throw new Error('insufficient_stock')
    const unitPrice = variant?.price ?? product.price
    return {
      id: index === 0 ? ORDER_LINE_ID : `50000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      name: variant ? `${product.name} - ${variant.name}` : product.name,
      image: variant?.images[0]?.src ?? product.images[0]?.src ?? null,
      quantity: item.quantity,
      unitPrice,
      subtotal: { amount: unitPrice.amount * item.quantity, currency: 'CRC' as const },
    }
  })
  const total = lines.reduce((sum, line) => sum + line.subtotal.amount, 0)
  const order: CommerceOrder = {
    id: ORDER_ID,
    orderNumber: 'FY-E2E-0001',
    status: 'pending',
    total: { amount: total, currency: 'CRC' },
    createdAt: '2026-08-20T12:00:00.000Z',
    paymentMethod: 'cash',
    lines,
    tracking: [{
      id: TRACKING_EVENT_ID,
      status: 'pending',
      title: 'Pedido recibido',
      description: 'Recibimos tu pedido y ya estamos preparándolo.',
      location: 'San José',
      createdAt: '2026-08-20T12:00:00.000Z',
    }],
  }

  state.idempotencyKeys.set(input.idempotencyKey, ORDER_ID)
  state.orders.set(ORDER_ID, order)
  return ORDER_ID
}

async function readFixtureOrder(orderId: string): Promise<CommerceOrder | null> {
  const order = fixtureState().orders.get(orderId)
  return order ? cloneOrder(order) : null
}

const e2eFixtureProvider: E2ECommerceFixtureProvider = {
  commerce: e2eFixtureCommerce,
  checkoutMethods: [{
    id: 'cash',
    label: 'Efectivo',
    description: 'Paga al recibir tu pedido',
  }],
  createOrder: createFixtureOrder,
  readOrder: readFixtureOrder,
}

export function getE2ECommerceFixtureProvider(
  env: Record<string, string | undefined> = process.env,
): E2ECommerceFixtureProvider | null {
  if (env.NODE_ENV === 'production') return null
  return env.FYTHER_E2E_COMMERCE_FIXTURE === 'live' ? e2eFixtureProvider : null
}
