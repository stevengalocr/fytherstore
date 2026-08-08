'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import type { CommerceMode, CommerceProduct, CommerceVariant } from '@/lib/commerce/types'

export default function ProductDetail({ product, mode }: { product: CommerceProduct; mode: CommerceMode }) {
  const { addProduct } = useCart()
  const [variant, setVariant] = useState<CommerceVariant | null>(product.variants[0] ?? null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const image = variant?.images[0] ?? product.images[0]
  const maxQuantity = variant?.stockQuantity ?? product.stockQuantity
  const available = product.availability === 'in_stock' && maxQuantity > 0
  const price = variant?.price ?? product.price

  const add = () => {
    if (!available) return
    addProduct(product, variant, quantity)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="detail-page container">
      <Link href="/catalogo" className="back-link"><ChevronLeft aria-hidden="true" size={18} /> Volver a la colección</Link>
      {mode === 'demo' && <p className="inline-demo">Producto de demostración. No representa una oferta activa.</p>}
      <div className="detail-layout">
        <div className="detail-media">
          {image ? <Image src={image.src} alt={image.alt} fill priority sizes="(max-width: 767px) 100vw, 58vw" /> : (
            <div className="product-fallback"><span>Imagen no disponible</span><strong>FYTHER</strong></div>
          )}
        </div>
        <div className="detail-copy">
          {product.category && <p className="product-category">{product.category}</p>}
          <h1 className="display">{product.name}</h1>
          <p className="detail-price">{formatMoney(price)}</p>
          <p className="detail-description">{product.description ?? product.shortDescription ?? 'Información del producto disponible próximamente.'}</p>

          {product.variants.length > 0 && (
            <fieldset className="variant-fieldset">
              <legend>Elige una opción</legend>
              <div>{product.variants.map((item) => (
                <button key={item.id} type="button" aria-pressed={variant?.id === item.id} disabled={item.stockQuantity === 0} onClick={() => { setVariant(item); setQuantity(1) }}>{item.name}</button>
              ))}</div>
            </fieldset>
          )}

          <div className="purchase-row">
            <div className="quantity-control" aria-label="Cantidad">
              <button type="button" aria-label="Reducir cantidad" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus aria-hidden="true" size={17} /></button>
              <output aria-label="Cantidad seleccionada">{quantity}</output>
              <button type="button" aria-label="Aumentar cantidad" disabled={quantity >= maxQuantity} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}><Plus aria-hidden="true" size={17} /></button>
            </div>
            <button type="button" className="button button-accent add-button" disabled={!available} onClick={add}>
              {added ? <><Check aria-hidden="true" size={18} /> Agregado</> : available ? <><ShoppingBag aria-hidden="true" size={18} /> Agregar al carrito</> : 'Agotado'}
            </button>
          </div>
          <p className="stock-note">{available ? `${maxQuantity} disponibles` : 'Sin existencias disponibles'}</p>
        </div>
      </div>
    </div>
  )
}
