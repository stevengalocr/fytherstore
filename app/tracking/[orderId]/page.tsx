import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isDemoOrderId } from '@/lib/commerce/orders'
import { readLiveOrder } from '@/lib/commerce/orders-server'
import DemoOrderView from '@/components/commerce/DemoOrderView'
import OrderPresentation from '@/components/commerce/OrderPresentation'

export const metadata: Metadata = { title: 'Seguimiento del pedido' }
export const dynamic = 'force-dynamic'

export default async function TrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  if (isDemoOrderId(orderId)) return <DemoOrderView orderId={orderId} view="tracking" />
  const order = await readLiveOrder(orderId)
  if (!order) notFound()
  return <OrderPresentation order={order} view="tracking" />
}
