'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { createOrder } from '@/app/actions/checkout'
import { formatMoney } from '@/lib/format'
import { normalizeCheckoutEmail } from '@/lib/commerce/checkout'
import { useCart } from '@/context/CartContext'
import type { CheckoutInput, PaymentMethod } from '@/lib/commerce/types'

export interface PaymentOption { id: PaymentMethod; label: string; description: string }

type FormState = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  notes: string
}

type RequiredField = 'name' | 'email' | 'address'
type FieldErrors = Partial<Record<RequiredField, string>>

const fieldErrorIds: Record<RequiredField, string> = {
  name: 'checkout-name-error',
  email: 'checkout-email-error',
  address: 'checkout-address-error',
}

export default function CheckoutClient({ methods }: { methods: PaymentOption[] }) {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', address: '', city: '', notes: '' })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(methods[0]?.id ?? null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [sending, setSending] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)
  const inFlightRef = useRef(false)
  const idempotencyKeyRef = useRef<string | null>(null)

  useEffect(() => {
    setPaymentMethod((current) => methods.some((method) => method.id === current) ? current : (methods[0]?.id ?? null))
  }, [methods])

  const change = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    idempotencyKeyRef.current = null
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setServerError('')
    if (field === 'name' || field === 'email' || field === 'address') {
      setFieldErrors((current) => {
        if (!current[field]) return current
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (inFlightRef.current) return
    setServerError('')

    const nextFieldErrors: FieldErrors = {}
    if (!form.name.trim()) nextFieldErrors.name = 'Ingresa tu nombre completo.'
    const normalizedEmail = normalizeCheckoutEmail(form.email)
    if (!normalizedEmail) nextFieldErrors.email = form.email.trim() ? 'Ingresa un correo electrónico válido.' : 'Ingresa tu correo electrónico.'
    if (!form.address.trim()) nextFieldErrors.address = 'Ingresa tu dirección exacta.'
    setFieldErrors(nextFieldErrors)

    const firstInvalidField = (['name', 'email', 'address'] as const).find((field) => nextFieldErrors[field])
    if (firstInvalidField) {
      const refs = { name: nameRef, email: emailRef, address: addressRef }
      refs[firstInvalidField].current?.focus()
      return
    }
    if (!normalizedEmail) return
    if (!items.length) { setServerError('Tu carrito está vacío.'); return }
    if (!paymentMethod || !methods.some((method) => method.id === paymentMethod)) {
      setServerError('No hay métodos de pago configurados. Contacta a Fyther.')
      return
    }
    inFlightRef.current = true
    setSending(true)

    const input: CheckoutInput = {
      idempotencyKey: idempotencyKeyRef.current ??= crypto.randomUUID(),
      items: items.map((line) => ({ productId: line.productId, variantId: line.variantId, name: line.name, variantName: line.variantName, image: line.image, quantity: line.quantity })),
      customer: { name: form.name, email: normalizedEmail, phone: form.phone },
      address: { address: form.address, city: form.city, country: 'Costa Rica', notes: form.notes },
      paymentMethod,
    }

    try {
      const result = await createOrder(input)
      if (!result.ok || !result.orderId) {
        setServerError(result.error ?? 'No pudimos crear el pedido.')
        return
      }
      idempotencyKeyRef.current = null
      clear()
      router.push(`/confirmacion/${result.orderId}`)
    } catch {
      setServerError('No pudimos conectar para confirmar tu pedido. Intenta de nuevo.')
    } finally {
      inFlightRef.current = false
      setSending(false)
    }
  }

  return (
    <div className="checkout-page container">
      <Link href="/carrito" className="back-link"><ArrowLeft aria-hidden="true" size={18} /> Volver al carrito</Link>
      <header><p className="section-label">FYTHER / CHECKOUT</p><h1 className="display">Terminemos juntas.</h1></header>
      {items.length === 0 ? (
        <div className="cart-empty"><h2 className="display">Tu carrito está vacío.</h2><Link className="button" href="/catalogo">Explorar colección</Link></div>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={submit} noValidate>
            <fieldset><legend>Contacto y entrega</legend>
              <div className="form-grid">
                <label className="field-block span-2">Nombre completo<input ref={nameRef} autoComplete="name" value={form.name} onChange={change('name')} required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? fieldErrorIds.name : undefined} />{fieldErrors.name && <span className="field-error" id={fieldErrorIds.name}>{fieldErrors.name}</span>}</label>
                <label className="field-block">Correo electrónico<input ref={emailRef} type="email" autoComplete="email" value={form.email} onChange={change('email')} required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? fieldErrorIds.email : undefined} />{fieldErrors.email && <span className="field-error" id={fieldErrorIds.email}>{fieldErrors.email}</span>}</label>
                <label className="field-block">Teléfono<input type="tel" autoComplete="tel" value={form.phone} onChange={change('phone')} /></label>
                <label className="field-block span-2">Dirección exacta<input ref={addressRef} autoComplete="street-address" value={form.address} onChange={change('address')} required aria-invalid={Boolean(fieldErrors.address)} aria-describedby={fieldErrors.address ? fieldErrorIds.address : undefined} />{fieldErrors.address && <span className="field-error" id={fieldErrorIds.address}>{fieldErrors.address}</span>}</label>
                <label className="field-block">Provincia o cantón<input autoComplete="address-level1" value={form.city} onChange={change('city')} /></label>
                <label className="field-block">Notas<textarea value={form.notes} onChange={change('notes')} rows={3} /></label>
              </div>
            </fieldset>

            <fieldset className="payment-fieldset"><legend>Método de pago</legend>
              {methods.length > 0 ? <div className="payment-options">{methods.map((method) => (
                <label key={method.id} className="payment-option"><input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => { idempotencyKeyRef.current = null; setPaymentMethod(method.id) }} /><span><strong>{method.label}</strong><small>{method.description}</small></span></label>
              ))}</div> : <p className="payment-missing">No hay métodos de pago configurados. Contacta a Fyther antes de continuar.</p>}
            </fieldset>

            {Object.keys(fieldErrors).length > 0 && <p className="form-error" role="alert">Revisa los campos marcados para continuar.</p>}
            {serverError && <p className="form-error" role="alert">{serverError}</p>}
            <button className="button button-accent checkout-submit" type="submit" disabled={sending || !paymentMethod || methods.length === 0}>
              {sending ? <><LoaderCircle className="spinner" aria-hidden="true" size={18} /> Confirmando tu pedido</> : `Confirmar pedido - ${formatMoney(subtotal)}`}
            </button>
          </form>

          <aside className="checkout-summary commerce-summary-panel"><h2>Tu pedido</h2>{items.map((line) => <div key={line.key}><span>{line.quantity} × {line.name}{line.variantName ? `, ${line.variantName}` : ''}</span><strong>{formatMoney({ amount: line.unitPrice.amount * line.quantity, currency: 'CRC' })}</strong></div>)}<p><span>Total</span><strong>{formatMoney(subtotal)}</strong></p></aside>
        </div>
      )}
    </div>
  )
}
