// Estructuras de datos de BilBildin (ver docs/05_REFERENCIA_TECNICA.md del repo bilbildin)

export interface Product {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  images: string[]
  category: string | null
  tags: string[]
  attributes: Record<string, unknown>
  featured: boolean
  stock_quantity: number
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string | null
  price_modifier: number
  stock_quantity: number
  attributes: Record<string, unknown>
  images: string[]
}

export type PaymentMethod = 'sinpe' | 'link' | 'cash'

export interface ThemeConfig {
  store_name?: string
  store_description?: string
  whatsapp?: string
  email?: string
  instagram?: string
  currency?: string
  sinpe_number?: string
  sinpe_name?: string
  link_url?: string
  link_instructions?: string
  cash_instructions?: string
}

export interface CartItem {
  product_id: string
  variant_id: string | null
  name: string
  variant_name: string | null   // "Talla M", "STEVEN · Cian neón" o "Precio dúo (2 uds.)"
  image: string | null
  price: number                 // precio unitario (el servidor lo verifica contra la BD)
  quantity: number
  slug: string
}

export interface TrackingEvent {
  id: string
  status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  title: string
  description: string | null
  location: string | null
  created_at: string
}

export interface OrderItemRow {
  id: string
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

// Etiqueta estándar del precio dúo (attributes.duo_price) — el server action
// la reconoce para verificar el precio especial contra la BD.
export const DUO_VARIANT_LABEL = 'Precio dúo (2 uds.)'
