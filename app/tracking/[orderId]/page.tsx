import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'
import { fmt } from '@/lib/format'
import type { OrderItemRow, TrackingEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Seguimiento de pedido · FYTHER STORE' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STATUS_LABELS: Record<string, string> = {
  pending:   'PEDIDO RECIBIDO',
  preparing: 'EN PREPARACIÓN',
  shipped:   'EN CAMINO',
  delivered: 'ENTREGADO',
  cancelled: 'CANCELADO',
}

export default async function TrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  if (!UUID_RE.test(orderId)) notFound()

  const supabase = createServiceClient()
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, total, created_at,
      items:order_items(id, product_name, quantity, unit_price, subtotal),
      tracking:order_tracking(id, status, title, description, location, created_at)
    `)
    .eq('id', orderId)
    .eq('business_id', process.env.NEXT_PUBLIC_BUSINESS_ID!)  // aislamiento obligatorio
    .order('created_at', { referencedTable: 'order_tracking', ascending: true })
    .single()

  if (!order) notFound()

  const events = (order.tracking ?? []) as TrackingEvent[]
  const items = (order.items ?? []) as OrderItemRow[]
  const status = order.status as string
  const statusClass = status === 'cancelled' ? ' cancelled' : status === 'delivered' ? ' delivered' : ''

  return (
    <div className="track-main">
      <Link href="/catalogo" className="back-link">← Volver a la tienda</Link>

      <div className="track-head" style={{ marginTop: 18 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>SEGUIMIENTO</h1>
          <p className="result-count" style={{ margin: 0 }}>
            Pedido <strong>{order.order_number}</strong> ·{' '}
            {new Date(order.created_at).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`track-status${statusClass}`}>{STATUS_LABELS[status] ?? status.toUpperCase()}</span>
      </div>

      <div className="confirm-panel" style={{ marginBottom: 22 }}>
        <span className="confirm-panel-title">HISTORIAL</span>
        {events.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(23,25,28,.55)' }}>
            Aún no hay eventos de seguimiento.
          </p>
        ) : (
          <ol className="timeline" style={{ marginTop: 6 }}>
            {events.map(ev => (
              <li key={ev.id}>
                <div className="tl-title">{ev.title}</div>
                {ev.description && <p className="tl-desc">{ev.description}</p>}
                <div className="tl-meta">
                  {ev.location && <span>{ev.location}</span>}
                  <time>
                    {new Date(ev.created_at).toLocaleString('es-CR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="confirm-panel">
        <span className="confirm-panel-title">PRODUCTOS</span>
        {items.map(i => (
          <div key={i.id} className="confirm-row">
            <span>{i.quantity}× {i.product_name}</span>
            <strong>{fmt(i.subtotal)}</strong>
          </div>
        ))}
        <div className="summary-divider" style={{ background: 'rgba(23,25,28,.1)' }} />
        <div className="confirm-row"><span>Total</span><strong>{fmt(order.total)}</strong></div>
        <div className="confirm-row">
          <span>Estado del pago</span>
          <strong>{order.payment_status === 'paid' ? 'Pagado' : order.payment_status === 'failed' ? 'Fallido' : 'Pendiente'}</strong>
        </div>
      </div>
    </div>
  )
}
