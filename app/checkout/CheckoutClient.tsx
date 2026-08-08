'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react'
import { createOrder } from '@/app/actions/checkout'
import { createDemoOrder } from '@/lib/commerce/demo-orders'
import { formatMoney } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import type { CheckoutInput, CommerceMode, PaymentMethod } from '@/lib/commerce/types'

export interface PaymentOption { id: PaymentMethod; label: string; description: string }

export default function CheckoutClient({ mode, methods }: { mode: CommerceMode; methods: PaymentOption[] }) {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', notes: '' })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(methods[0]?.id ?? 'demo')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const change = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.address.trim()) {
      setError('Completa nombre, correo y dirección para continuar.')
      return
    }
    if (!items.length) { setError('Tu carrito está vacío.'); return }
    if (!methods.length) { setError('No hay métodos de pago configurados. Contacta a Fyther.'); return }
    setSending(true)

    const input: CheckoutInput = {
      items: items.map((line) => ({ productId: line.productId, variantId: line.variantId, name: line.name, variantName: line.variantName, image: line.image, quantity: line.quantity })),
      customer: { name: form.name, email: form.email, phone: form.phone },
      address: { address: form.address, city: form.city, country: 'Costa Rica', notes: form.notes },
      paymentMethod,
    }

    if (mode === 'demo') {
      try {
        const order = createDemoOrder(input)
        localStorage.setItem(`fyther-demo-order:${order.id}`, JSON.stringify(order))
        clear()
        router.push(`/confirmacion/${order.id}`)
      } catch (demoError) {
        setError(demoError instanceof Error ? demoError.message : 'No pudimos simular el pedido.')
        setSending(false)
      }
      return
    }

    const result = await createOrder(input)
    if (!result.ok || !result.orderId) { setError(result.error ?? 'No pudimos crear el pedido.'); setSending(false); return }
    clear()
    router.push(`/confirmacion/${result.orderId}`)
  }

  return (
    <div className="checkout-page container">
      <Link href="/carrito" className="back-link"><ArrowLeft aria-hidden="true" size={18} /> Volver al carrito</Link>
      <header><p className="section-label">FYTHER / CHECKOUT</p><h1 className="display">Cierra el movimiento.</h1></header>
      {mode === 'demo' && <div className="checkout-demo"><Check aria-hidden="true" size={18} /><span>Simulación activa. No se realizará ningún cobro.</span></div>}
      {items.length === 0 ? (
        <div className="cart-empty"><h2 className="display">Tu carrito está vacío.</h2><Link className="button" href="/catalogo">Explorar colección</Link></div>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={submit} noValidate>
            <fieldset><legend>Contacto y entrega</legend>
              <div className="form-grid">
                <label className="field-block span-2">Nombre completo<input autoComplete="name" value={form.name} onChange={change('name')} required /></label>
                <label className="field-block">Correo electrónico<input type="email" autoComplete="email" value={form.email} onChange={change('email')} required /></label>
                <label className="field-block">Teléfono<input type="tel" autoComplete="tel" value={form.phone} onChange={change('phone')} /></label>
                <label className="field-block span-2">Dirección exacta<input autoComplete="street-address" value={form.address} onChange={change('address')} required /></label>
                <label className="field-block">Provincia o cantón<input autoComplete="address-level1" value={form.city} onChange={change('city')} /></label>
                <label className="field-block">Notas<textarea value={form.notes} onChange={change('notes')} rows={3} /></label>
              </div>
            </fieldset>

            <fieldset className="payment-fieldset"><legend>Método de pago</legend>
              {methods.length > 0 ? <div className="payment-options">{methods.map((method) => (
                <label key={method.id} className="payment-option"><input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} /><span><strong>{method.label}</strong><small>{method.description}</small></span></label>
              ))}</div> : <p className="payment-missing">No hay métodos de pago configurados. Contacta a Fyther antes de continuar.</p>}
            </fieldset>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-accent checkout-submit" type="submit" disabled={sending || methods.length === 0}>
              {sending ? <><LoaderCircle className="spinner" aria-hidden="true" size={18} /> Procesando</> : `Confirmar pedido - ${formatMoney(subtotal)}`}
            </button>
          </form>

          <aside className="checkout-summary"><h2>Tu pedido</h2>{items.map((line) => <div key={line.key}><span>{line.quantity} × {line.name}{line.variantName ? `, ${line.variantName}` : ''}</span><strong>{formatMoney({ amount: line.unitPrice.amount * line.quantity, currency: 'CRC' })}</strong></div>)}<p><span>Total</span><strong>{formatMoney(subtotal)}</strong></p></aside>
        </div>
      )}
    </div>
  )
}
