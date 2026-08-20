export type CommerceMode = 'unconfigured' | 'live'
export type CurrencyCode = 'CRC'
export type Availability = 'in_stock' | 'out_of_stock' | 'unavailable'

export interface Money {
  amount: number
  currency: CurrencyCode
}

export interface CommerceImage {
  src: string
  alt: string
}

export interface CommerceVariant {
  id: string
  name: string
  sku: string | null
  price: Money
  stockQuantity: number
  attributes: Record<string, unknown>
  images: CommerceImage[]
}

export interface CommerceProduct {
  id: string
  slug: string
  name: string
  brand: string | null
  shortDescription: string | null
  description: string | null
  price: Money
  compareAtPrice: Money | null
  images: CommerceImage[]
  availability: Availability
  stockQuantity: number
  variants: CommerceVariant[]
  category: string | null
  tags: string[]
  featured: boolean
}

export type PaymentMethod = 'sinpe' | 'link' | 'cash'

export interface CheckoutLine {
  productId: string
  variantId: string | null
  name: string
  variantName: string | null
  image: string | null
  quantity: number
}

export interface CartLine extends CheckoutLine {
  key: string
  slug: string
  unitPrice: Money
  maxQuantity: number
}

export interface CheckoutInput {
  idempotencyKey: string
  items: CheckoutLine[]
  customer: { name: string; email: string; phone: string }
  address: { address: string; city: string; country: string; notes: string }
  paymentMethod: PaymentMethod
}

export interface CheckoutResult {
  ok: boolean
  mode: CommerceMode
  orderId?: string
  error?: string
}

export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export interface CommerceOrderLine {
  id: string
  name: string
  image: string | null
  quantity: number
  unitPrice: Money
  subtotal: Money
}

export interface CommerceTrackingEvent {
  id: string
  status: OrderStatus
  title: string
  description: string | null
  location: string | null
  createdAt: string
}

export interface CommerceOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  total: Money
  createdAt: string
  paymentMethod: PaymentMethod
  lines: CommerceOrderLine[]
  tracking: CommerceTrackingEvent[]
}

export interface ThemeConfig {
  whatsapp?: string
  email?: string
  sinpe_number?: string
  link_url?: string
  link_instructions?: string
  cash_instructions?: string
}
