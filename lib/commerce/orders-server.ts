import 'server-only'
import { createServiceClient, getServerBusinessId } from '@/lib/supabase-server'
import { buildOrderFilters } from '@/lib/commerce/orders'
import type { CommerceOrder, OrderStatus, PaymentMethod } from '@/lib/commerce/types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface OrderRow {
  id: string
  order_number: string
  status: OrderStatus
  total: number
  created_at: string
  payment_method: PaymentMethod
  items: Array<{ id: string; product_name: string; product_image: string | null; quantity: number; unit_price: number; subtotal: number }> | null
  tracking: Array<{ id: string; status: OrderStatus; title: string; description: string | null; location: string | null; created_at: string }> | null
}

export async function readLiveOrder(orderId: string): Promise<CommerceOrder | null> {
  if (!UUID.test(orderId)) return null
  const businessId = getServerBusinessId()
  const filters = buildOrderFilters(orderId, businessId)
  const { data, error } = await createServiceClient().from('orders').select(`
    id,order_number,status,total,created_at,payment_method,
    items:order_items(id,product_name,product_image,quantity,unit_price,subtotal),
    tracking:order_tracking(id,status,title,description,location,created_at)
  `).eq('id', filters.id).eq('business_id', filters.business_id)
    .order('created_at', { referencedTable: 'order_tracking', ascending: true }).maybeSingle()
  if (error || !data) return null
  const row = data as unknown as OrderRow
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    total: { amount: Number(row.total), currency: 'CRC' },
    createdAt: row.created_at,
    paymentMethod: row.payment_method,
    lines: (row.items ?? []).map((item) => ({
      id: item.id,
      name: item.product_name,
      image: item.product_image,
      quantity: item.quantity,
      unitPrice: { amount: Number(item.unit_price), currency: 'CRC' },
      subtotal: { amount: Number(item.subtotal), currency: 'CRC' },
    })),
    tracking: (row.tracking ?? []).map((event) => ({
      id: event.id,
      status: event.status,
      title: event.title,
      description: event.description,
      location: event.location,
      createdAt: event.created_at,
    })),
  }
}
