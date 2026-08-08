'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { useCart } from '@/context/CartContext'

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart()

  return (
    <div className="cart-page container">
      <header><p className="section-label">FYTHER / BAG</p><h1 className="display">Tu selección.</h1></header>
      {items.length === 0 ? (
        <div className="cart-empty"><h2 className="display">Todavía hay espacio.</h2><p>Agrega una pieza para comenzar.</p><Link className="button" href="/catalogo">Explorar colección</Link></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map((line) => (
              <article key={line.key} className="cart-line">
                <div className="cart-line-image">{line.image ? <Image src={line.image} alt="" fill sizes="120px" /> : <span>FYTHER</span>}</div>
                <div className="cart-line-copy">
                  <Link href={`/catalogo/${line.slug}`}><h2>{line.name}</h2></Link>
                  {line.variantName && <p>{line.variantName}</p>}
                  <span>{formatMoney(line.unitPrice)}</span>
                </div>
                <div className="cart-line-actions">
                  <div className="quantity-control" aria-label={`Cantidad de ${line.name}`}>
                    <button type="button" aria-label={`Reducir ${line.name}`} onClick={() => setQuantity(line.key, line.quantity - 1)}><Minus aria-hidden="true" size={16} /></button>
                    <output>{line.quantity}</output>
                    <button type="button" aria-label={`Aumentar ${line.name}`} disabled={line.quantity >= line.maxQuantity} onClick={() => setQuantity(line.key, line.quantity + 1)}><Plus aria-hidden="true" size={16} /></button>
                  </div>
                  <button type="button" className="remove-button" aria-label={`Eliminar ${line.name}`} onClick={() => removeItem(line.key)}><Trash2 aria-hidden="true" size={18} /></button>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Resumen</h2>
            <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
            <p>El envío y las instrucciones de pago se confirman durante el checkout.</p>
            <Link className="button button-accent" href="/checkout">Ir al checkout</Link>
            <Link className="text-link" href="/catalogo">Seguir explorando</Link>
          </aside>
        </div>
      )}
    </div>
  )
}
