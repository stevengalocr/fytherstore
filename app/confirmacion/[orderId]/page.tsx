import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'
import { fmt } from '@/lib/format'
import type { OrderItemRow, ThemeConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pedido confirmado · FYTHER STORE' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAYMENT_LABELS: Record<string, string> = { sinpe: 'SINPE Móvil', link: 'Link de pago', cash: 'Efectivo' }

export default async function ConfirmacionPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  if (!UUID_RE.test(orderId)) notFound()

  const supabase = createServiceClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, total, payment_method, payment_status, shipping_address, created_at, items:order_items(id, product_name, quantity, unit_price, subtotal)')
    .eq('id', orderId)
    .eq('business_id', process.env.NEXT_PUBLIC_BUSINESS_ID!)  // aislamiento obligatorio
    .single()

  if (!order) notFound()

  const { data: biz } = await supabase
    .from('businesses')
    .select('theme_config')
    .eq('id', process.env.NEXT_PUBLIC_BUSINESS_ID!)
    .single()
  const config = (biz?.theme_config ?? {}) as ThemeConfig

  const items = (order.items ?? []) as OrderItemRow[]
  const method = order.payment_method as string | null
  const whatsappDigits = (config.whatsapp ?? '').replace(/\D/g, '')
  const waText = encodeURIComponent(`Hola, hice el pedido ${order.order_number} en FYTHER STORE y quiero coordinar el pago/envío.`)

  return (
    <div className="confirm-main">
      <div className="confirm-hero">
        <div className="success-ring">✓</div>
        <h1 className="success-title">¡PEDIDO CONFIRMADO!</h1>
        <p className="success-copy">
          Gracias por tu compra. Tu número de pedido es{' '}
          <span className="confirm-order-no">{order.order_number}</span>.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href={`/tracking/${order.id}`} className="btn-neon-a btn-link" style={{ padding: '14px 28px', fontSize: 14 }}>
            SEGUIR MI PEDIDO
          </Link>
          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon-b-outline btn-link"
              style={{ padding: '14px 28px', fontSize: 14 }}
            >
              COORDINAR POR WHATSAPP
            </a>
          )}
        </div>
      </div>

      <div className="confirm-panel">
        <span className="confirm-panel-title">RESUMEN DEL PEDIDO</span>
        {items.map(i => (
          <div key={i.id} className="confirm-row">
            <span>{i.quantity}× {i.product_name}</span>
            <strong>{fmt(i.subtotal)}</strong>
          </div>
        ))}
        <div className="summary-divider" style={{ background: 'rgba(23,25,28,.1)' }} />
        <div className="confirm-row">
          <span>Total</span>
          <strong>{fmt(order.total)}</strong>
        </div>
        <div className="confirm-row">
          <span>Método de pago</span>
          <strong>{PAYMENT_LABELS[method ?? ''] ?? '—'}</strong>
        </div>
      </div>

      <div className="confirm-panel">
        <span className="confirm-panel-title">CÓMO COMPLETAR TU PAGO</span>
        {method === 'sinpe' && config.sinpe_number && (
          <div className="pay-instructions">
            Realiza la transferencia por <strong>SINPE Móvil</strong> al número{' '}
            <strong>{config.sinpe_number}</strong>
            {config.sinpe_name ? <> a nombre de <strong>{config.sinpe_name}</strong></> : null} por{' '}
            <strong>{fmt(order.total)}</strong>, y envía el comprobante por WhatsApp indicando tu número de pedido{' '}
            <strong>{order.order_number}</strong>.
          </div>
        )}
        {method === 'link' && (
          <div className="pay-instructions">
            {config.link_instructions || 'Te enviaremos un enlace de pago por WhatsApp o correo para completar tu compra.'}
          </div>
        )}
        {method === 'cash' && (
          <div className="pay-instructions">
            {config.cash_instructions || 'El pago se realiza en efectivo al momento de la entrega.'}
          </div>
        )}
        <span style={{ fontSize: 12.5, color: 'rgba(23,25,28,.5)' }}>
          Guarda el enlace de seguimiento: podrás ver el estado de tu pedido en cualquier momento.
        </span>
      </div>
    </div>
  )
}
