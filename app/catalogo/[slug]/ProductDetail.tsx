'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import type { CommerceProduct, CommerceVariant } from '@/lib/commerce/types'

export default function ProductDetail({ product }: { product: CommerceProduct }) {
  const { addProduct } = useCart()
  const initialVariant = product.variants.find((item) => item.stockQuantity > 0) ?? product.variants[0] ?? null
  const [variant, setVariant] = useState<CommerceVariant | null>(initialVariant)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<number | null>(null)
  const image = variant?.images[0] ?? product.images[0]
  const maxQuantity = Math.max(0, variant?.stockQuantity ?? product.stockQuantity)
  const hasAvailableSelection = product.variants.length === 0 || variant !== null
  const available = product.availability === 'in_stock' && hasAvailableSelection && maxQuantity > 0
  const price = variant?.price ?? product.price
  const description = product.description?.trim()
    || product.shortDescription?.trim()
    || 'Información del producto disponible próximamente.'

  useEffect(() => () => {
    if (addedTimer.current) window.clearTimeout(addedTimer.current)
  }, [])

  const add = () => {
    if (!available) return
    addProduct(product, variant, quantity)
    setAdded(true)
    if (addedTimer.current) window.clearTimeout(addedTimer.current)
    addedTimer.current = window.setTimeout(() => setAdded(false), 1800)
  }

  const selectVariant = (item: CommerceVariant) => {
    if (item.stockQuantity <= 0) return
    setVariant(item)
    setQuantity(1)
    setAdded(false)
  }

  return (
    <div className="detail-page container">
      <Link href="/catalogo" className="back-link"><ChevronLeft aria-hidden="true" size={18} /> Volver a la colección</Link>
      <div className="detail-layout">
        <div className="detail-media">
          {image ? <Image src={image.src} alt={image.alt} fill priority sizes="(max-width: 767px) 100vw, 58vw" /> : (
            <div className="product-fallback"><span>Imagen no disponible</span><strong>{product.name}</strong></div>
          )}
        </div>
        <div className="detail-copy">
          {product.category && <p className="product-category">{product.category}</p>}
          <h1 className="display">{product.name}</h1>
          <p className="detail-price">{formatMoney(price)}</p>
          <p className="detail-description">{description}</p>

          {product.variants.length > 0 && (
            <fieldset className="variant-fieldset">
              <legend>Elige tu opción</legend>
              <div>{product.variants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={variant?.id === item.id}
                  disabled={item.stockQuantity <= 0}
                  onClick={() => selectVariant(item)}
                >
                  {item.name}
                </button>
              ))}</div>
            </fieldset>
          )}

          <div className="purchase-row">
            <div className="quantity-control" aria-label="Cantidad">
              <button type="button" aria-label="Reducir cantidad" disabled={!available || quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus aria-hidden="true" size={17} /></button>
              <output aria-label="Cantidad seleccionada">{quantity}</output>
              <button type="button" aria-label="Aumentar cantidad" disabled={!available || quantity >= maxQuantity} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}><Plus aria-hidden="true" size={17} /></button>
            </div>
            <button type="button" className="button button-accent add-button" disabled={!available} onClick={add}>
              {added ? <><Check aria-hidden="true" size={18} /> <span aria-live="polite">Agregado al carrito</span></> : available ? <><ShoppingBag aria-hidden="true" size={18} /> <span aria-live="polite">Agregar al carrito</span></> : <span aria-live="polite">Agotado</span>}
            </button>
          </div>
          <p className="stock-note">{available ? `${maxQuantity} disponibles` : 'Sin existencias disponibles'}</p>
        </div>
      </div>
    </div>
  )
}
