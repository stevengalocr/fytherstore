import Link from 'next/link'
import { Check, ChevronLeft, MapPin } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import type { CommerceOrder } from '@/lib/commerce/types'
import BrandMark from '@/components/BrandMark'

const PAYMENT: Record<string, string> = { sinpe: 'SINPE Móvil', link: 'Link de pago', cash: 'Efectivo' }
const STATUS: Record<string, string> = { pending: 'Pedido recibido', preparing: 'En preparación', shipped: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado' }

export default function OrderPresentation({ order, view }: { order: CommerceOrder; view: 'confirmation' | 'tracking' }) {
  if (view === 'confirmation') {
    return (
      <div className="order-page container">
        <div className="confirmation-lead"><span className="order-brand"><BrandMark decorative variant="alternate" sizes="120px" /></span><span className="confirmation-icon"><Check aria-hidden="true" size={28} /></span><p className="section-label">FYTHER / CONFIRMACIÓN</p><h1 className="display">Pedido confirmado.</h1><p>Tu número de pedido es <strong>{order.orderNumber}</strong>.</p><Link className="button button-accent" href={`/tracking/${order.id}`}>Seguir pedido</Link></div>
        <OrderSummary order={order} />
      </div>
    )
  }

  return (
    <div className="order-page container">
      <Link href="/catalogo" className="back-link"><ChevronLeft aria-hidden="true" size={18} /> Volver a la colección</Link>
      <header className="tracking-head"><div><p className="section-label">FYTHER / TRACKING</p><h1 className="display">Tu pedido sigue su camino.</h1><p>Pedido {order.orderNumber}</p></div><strong>{STATUS[order.status] ?? order.status}</strong></header>
      <div className="tracking-layout">
        <section className="tracking-events" aria-labelledby="events-title"><h2 id="events-title">Historial</h2>{order.tracking.length ? <ol>{order.tracking.map((event) => <li key={event.id}><span aria-hidden="true" /><div><strong>{event.title}</strong>{event.description && <p>{event.description}</p>}<small>{event.location && <><MapPin aria-hidden="true" size={14} /> {event.location}, </>}{new Date(event.createdAt).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })}</small></div></li>)}</ol> : <p>Aún no hay eventos de seguimiento.</p>}</section>
        <OrderSummary order={order} compact />
      </div>
    </div>
  )
}

function OrderSummary({ order, compact = false }: { order: CommerceOrder; compact?: boolean }) {
  return (
    <section className={`order-summary${compact ? ' compact' : ''}`} aria-labelledby={`summary-${order.id}`}>
      <h2 id={`summary-${order.id}`}>Resumen</h2>
      {order.lines.map((line) => <div key={line.id}><span>{line.quantity} x {line.name}</span><strong>{formatMoney(line.subtotal)}</strong></div>)}
      <div><span>Método</span><strong>{PAYMENT[order.paymentMethod] ?? order.paymentMethod}</strong></div>
      <p><span>Total</span><strong>{formatMoney(order.total)}</strong></p>
    </section>
  )
}
