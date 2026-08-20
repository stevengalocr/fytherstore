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
  const firstAvailableVariant = product.variants.find((item) => item.stockQuantity > 0) ?? null
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(firstAvailableVariant?.id ?? null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<number | null>(null)
  const previousProductId = useRef(product.id)
  const variant = product.variants.find((item) => item.id === selectedVariantId && item.stockQuantity > 0)
    ?? firstAvailableVariant
  const resolvedVariantId = variant?.id ?? null
  const selectionNeedsReset = previousProductId.current !== product.id || selectedVariantId !== resolvedVariantId
  const image = variant?.images[0] ?? product.images[0]
  const maxQuantity = Math.max(0, variant?.stockQuantity ?? product.stockQuantity)
  const hasAvailableSelection = product.variants.length === 0 || variant !== null
  const available = product.availability === 'in_stock' && hasAvailableSelection && maxQuantity > 0
  const selectedQuantity = selectionNeedsReset ? 1 : Math.min(quantity, Math.max(1, maxQuantity))
  const price = variant?.price ?? product.price
  const description = product.description?.trim()
    || product.shortDescription?.trim()
    || 'Información del producto disponible próximamente.'

  useEffect(() => () => {
    if (addedTimer.current !== null) {
      window.clearTimeout(addedTimer.current)
      addedTimer.current = null
    }
  }, [])

  useEffect(() => {
    previousProductId.current = product.id

    if (selectionNeedsReset) {
      setSelectedVariantId(resolvedVariantId)
      setQuantity(1)
      setAdded(false)
      if (addedTimer.current !== null) {
        window.clearTimeout(addedTimer.current)
        addedTimer.current = null
      }
      return
    }

    setQuantity((value) => Math.min(value, Math.max(1, maxQuantity)))
  }, [maxQuantity, product.id, resolvedVariantId, selectionNeedsReset])

  const add = () => {
    if (!available) return
    addProduct(product, variant, selectedQuantity)
    setAdded(true)
    if (addedTimer.current !== null) window.clearTimeout(addedTimer.current)
    addedTimer.current = window.setTimeout(() => {
      addedTimer.current = null
      setAdded(false)
    }, 1800)
  }

  const selectVariant = (item: CommerceVariant) => {
    if (item.stockQuantity <= 0) return
    setSelectedVariantId(item.id)
    setQuantity(1)
    setAdded(false)
    if (addedTimer.current !== null) {
      window.clearTimeout(addedTimer.current)
      addedTimer.current = null
    }
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
          {product.brand ? <p className="detail-brand">{product.brand}</p> : null}
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
                  aria-pressed={resolvedVariantId === item.id}
                  disabled={item.stockQuantity <= 0}
                  onClick={() => selectVariant(item)}
                >
                  {item.name}
                </button>
              ))}</div>
            </fieldset>
          )}

          <div className="purchase-row">
            <div className="quantity-control" role="group" aria-label={`Cantidad de ${product.name}`}>
              <button type="button" aria-label="Reducir cantidad" disabled={!available || selectedQuantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus aria-hidden="true" size={17} /></button>
              <span className="quantity-value" aria-label="Cantidad seleccionada">{selectedQuantity}</span>
              <button type="button" aria-label="Aumentar cantidad" disabled={!available || selectedQuantity >= maxQuantity} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}><Plus aria-hidden="true" size={17} /></button>
            </div>
            <button type="button" className="button button-accent add-button" disabled={!available} onClick={add}>
              {added ? <><Check aria-hidden="true" size={18} /> Agregado al carrito</> : available ? <><ShoppingBag aria-hidden="true" size={18} /> Agregar al carrito</> : 'Agotado'}
            </button>
          </div>
          <p className="purchase-status" role="status" aria-live="polite" aria-atomic="true">{added ? 'Agregado al carrito' : ''}</p>
          <p className="stock-note">{available ? `${maxQuantity} disponibles` : 'Sin existencias disponibles'}</p>
        </div>
      </div>
    </div>
  )
}
