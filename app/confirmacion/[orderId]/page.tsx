import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { readLiveOrder } from '@/lib/commerce/orders-server'
import OrderPresentation from '@/components/commerce/OrderPresentation'
import { commerceMode } from '@/lib/commerce'

export const metadata: Metadata = { title: 'Pedido confirmado' }
export const dynamic = 'force-dynamic'

export default async function ConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  if (commerceMode !== 'live') notFound()
  const order = await readLiveOrder(orderId)
  if (!order) notFound()
  return <OrderPresentation order={order} view="confirmation" />
}
