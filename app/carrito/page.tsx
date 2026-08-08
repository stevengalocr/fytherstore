'use client'

import Link from 'next/link'
import { useCart, lineKey } from '@/context/CartContext'
import { fmt, placeholderBg } from '@/lib/format'

export default function CarritoPage() {
  const { items, subtotal, setQty, removeItem } = useCart()

  return (
    <div className="cart-main">
      <h1 className="page-title" style={{ marginBottom: 30 }}>TU CARRITO</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <span>Tu carrito está vacío.</span>
          <Link href="/catalogo" className="btn-neon-a btn-link">IR AL CATÁLOGO</Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-lines">
            {items.map(l => {
              const key = lineKey(l)
              return (
                <div key={key} className="cart-line">
                  <div className="cart-line-thumb" style={l.image ? undefined : { background: placeholderBg(l.product_id) }}>
                    {l.image && <img src={l.image} alt={l.name} />}
                  </div>
                  <div className="cart-line-info">
                    <span className="cart-line-name">{l.name}</span>
                    <span className="cart-line-meta">{l.variant_name ?? 'Estándar'}</span>
                    <span className="cart-line-price">{fmt(l.price * l.quantity)}</span>
                  </div>
                  <div className="cart-qty">
                    <button onClick={() => setQty(key, -1)}>−</button>
                    <span>{l.quantity}</span>
                    <button onClick={() => setQty(key, 1)}>+</button>
                  </div>
                  <button className="cart-remove" title="Quitar" onClick={() => removeItem(key)}>✕</button>
                </div>
              )
            })}
          </div>

          <div className="summary">
            <span className="summary-title">RESUMEN</span>
            <div className="summary-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="summary-row"><span>Envío</span><span>Se coordina al confirmar</span></div>
            <div className="summary-divider" />
            <div className="summary-total"><span>Total</span><span className="amount">{fmt(subtotal)}</span></div>
            <Link href="/checkout" className="checkout-btn btn-link">FINALIZAR COMPRA</Link>
            <span className="summary-note">Coordinamos el pago y el envío por WhatsApp al confirmar tu pedido</span>
          </div>
        </div>
      )}
    </div>
  )
}
