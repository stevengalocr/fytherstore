'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { createOrder } from '@/app/actions/checkout'
import { fmt } from '@/lib/format'
import type { PaymentMethod } from '@/lib/types'

type Method = { id: PaymentMethod; label: string; sub: string }

export default function CheckoutClient({ methods }: { methods: Method[] }) {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()

  const [form, setForm] = useState({ nombre: '', correo: '', tel: '', dir: '', ciudad: '', notas: '' })
  const [pay, setPay] = useState<PaymentMethod>(methods[0]?.id ?? 'cash')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError(null)
    if (!form.nombre.trim() || !form.correo.trim() || !form.dir.trim()) {
      setError('Completa nombre, correo y dirección para continuar.')
      return
    }
    if (items.length === 0) {
      setError('Tu carrito está vacío.')
      return
    }
    setSending(true)
    const result = await createOrder({
      items: items.map(l => ({
        product_id: l.product_id,
        variant_id: l.variant_id,
        name: l.name,
        variant_name: l.variant_name,
        image: l.image,
        price: l.price,
        quantity: l.quantity,
      })),
      customer: { name: form.nombre, email: form.correo, phone: form.tel },
      address: { address: form.dir, city: form.ciudad, country: 'Costa Rica', notes: form.notas },
      paymentMethod: pay,
    })
    if (!result.ok) {
      setError(result.error)
      setSending(false)
      return
    }
    clear()
    router.push(`/confirmacion/${result.orderId}`)
  }

  if (items.length === 0 && !sending) {
    return (
      <div className="cart-main">
        <h1 className="page-title" style={{ marginBottom: 30 }}>CHECKOUT</h1>
        <div className="cart-empty">
          <span>Tu carrito está vacío.</span>
          <Link href="/catalogo" className="btn-neon-a btn-link">IR AL CATÁLOGO</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-main">
      <Link href="/carrito" className="back-link">← Volver al carrito</Link>
      <h1 className="page-title checkout-title">CHECKOUT</h1>

      <div className="checkout-grid">
        <div className="checkout-form">
          <span className="form-title">DATOS DE ENVÍO</span>
          <div className="form-fields">
            <input className="field span-2" placeholder="Nombre completo" value={form.nombre} onChange={set('nombre')} />
            <input className="field" type="email" placeholder="Correo electrónico" value={form.correo} onChange={set('correo')} />
            <input className="field" placeholder="Teléfono" value={form.tel} onChange={set('tel')} />
            <input className="field span-2" placeholder="Dirección exacta" value={form.dir} onChange={set('dir')} />
            <input className="field" placeholder="Provincia / Cantón" value={form.ciudad} onChange={set('ciudad')} />
            <input className="field" placeholder="Notas (opcional)" value={form.notas} onChange={set('notas')} />
          </div>

          <span className="form-title" style={{ marginTop: 8 }}>MÉTODO DE PAGO</span>
          <div className="pay-list">
            {methods.map(m => (
              <div key={m.id} className={`pay-option${pay === m.id ? ' on' : ''}`} onClick={() => setPay(m.id)}>
                <span className="pay-radio"><i /></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span className="pay-label">{m.label}</span>
                  <span className="pay-sub">{m.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="notice-error">{error}</div>}

          <button className="confirm-btn" onClick={submit} disabled={sending}>
            {sending ? <><span className="spin" />PROCESANDO…</> : <>CONFIRMAR PEDIDO · {fmt(subtotal)}</>}
          </button>
        </div>

        <div className="order-panel">
          <span className="form-title">TU PEDIDO</span>
          {items.map(l => (
            <div key={`${l.product_id}|${l.variant_id ?? ''}|${l.variant_name ?? ''}`} className="order-line">
              <span>{l.quantity}× {l.name}{l.variant_name ? ` — ${l.variant_name}` : ''}</span>
              <span>{fmt(l.price * l.quantity)}</span>
            </div>
          ))}
          <div className="summary-divider" />
          <div className="order-ship"><span>Envío</span><span>Se coordina al confirmar</span></div>
          <div className="order-total"><span>Total</span><span className="amount">{fmt(subtotal)}</span></div>
        </div>
      </div>
    </div>
  )
}
