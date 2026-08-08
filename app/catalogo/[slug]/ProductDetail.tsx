'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { fmt, placeholderBg } from '@/lib/format'
import { DUO_VARIANT_LABEL, type Product, type ProductVariant } from '@/lib/types'

const CUSTOM_COLORS = [
  { name: 'Cian neón', hex: '#35dfe0' },
  { name: 'Rosa neón', hex: '#ff7fc0' },
  { name: 'Lima', hex: '#b8e34d' },
  { name: 'Violeta', hex: '#9d7bff' },
  { name: 'Blanco', hex: '#f2f2f2' },
]

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart()
  const router = useRouter()

  const attrs = (product.attributes ?? {}) as Record<string, unknown>
  const isCustom = !!attrs.custom
  const duoPrice = Number(attrs.duo_price)
  const hasDuo = Number.isFinite(duoPrice) && duoPrice > 0
  const variants = (product.variants ?? []) as ProductVariant[]
  const image = product.images?.[0] ?? null
  const out = product.stock_quantity <= 0

  const [variantId, setVariantId] = useState<string | null>(null)
  const [duo, setDuo] = useState(false)
  const [custText, setCustText] = useState('')
  const [custColor, setCustColor] = useState(CUSTOM_COLORS[0])
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const variant = variants.find(v => v.id === variantId) ?? null
  const unitPrice = useMemo(() => {
    if (duo && hasDuo) return duoPrice / 2
    return product.price + (variant?.price_modifier ?? 0)
  }, [duo, hasDuo, duoPrice, product.price, variant])

  const add = () => {
    setError(null)
    if (out) return
    if (variants.length > 0 && !variant && !duo) {
      setError('Elegí una opción antes de agregar al carrito.')
      return
    }
    const custLabel = isCustom ? `${(custText.trim() || 'TU NOMBRE').toUpperCase()} · ${custColor.name}` : null
    const variantName = duo && hasDuo
      ? DUO_VARIANT_LABEL
      : [variant?.name ?? null, custLabel].filter(Boolean).join(' · ') || null

    addItem({
      product_id: product.id,
      variant_id: duo ? null : (variant?.id ?? null),
      name: product.name,
      variant_name: variantName,
      image,
      price: unitPrice,
      quantity: duo ? 2 : qty,
      slug: product.slug,
    })
    router.push('/carrito')
  }

  return (
    <div className="detail-grid">
      {/* Media */}
      <div className="detail-img" style={image ? undefined : { background: placeholderBg(product.id) }}>
        {isCustom ? (
          <div
            className="plate-preview"
            style={{ borderColor: custColor.hex, boxShadow: `0 0 30px ${custColor.hex}66` }}
          >
            <div className="plate-hole" />
            <span className="plate-preview-name" style={{ color: custColor.hex }}>
              {custText.trim() || 'TU NOMBRE'}
            </span>
            <span className="plate-preview-weight">25<small>KG</small></span>
            <span className="plate-preview-brand">FYTHER</span>
          </div>
        ) : image ? (
          <img src={image} alt={product.name} />
        ) : (
          <span className="ph-label">[ foto: {product.name.toLowerCase()} ]</span>
        )}
      </div>

      {/* Info */}
      <div className="detail-info">
        <span className="detail-cat">{(product.category ?? 'FYTHER').toUpperCase()}</span>
        <h1 className="detail-name">{product.name}</h1>
        <span className="detail-price">
          {fmt(unitPrice)}
          {product.compare_at_price != null && product.compare_at_price > product.price && !duo && (
            <span className="price-compare">{fmt(product.compare_at_price)}</span>
          )}
        </span>
        {product.description && <p className="detail-desc">{product.description}</p>}

        {out ? (
          <span className="stock-low">Agotado por el momento — vuelve pronto.</span>
        ) : product.stock_quantity <= 5 ? (
          <span className="stock-low">¡Últimas {product.stock_quantity} unidades!</span>
        ) : (
          <span className="stock-ok">En stock · listo para envío</span>
        )}

        {/* Variantes (tallas / opciones del admin) */}
        {variants.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="opt-label">OPCIONES</span>
            <div className="size-row" style={{ flexWrap: 'wrap' }}>
              {variants.map(v => (
                <button
                  key={v.id}
                  className={`variant-btn${variantId === v.id ? ' on' : ''}`}
                  disabled={v.stock_quantity <= 0}
                  onClick={() => { setVariantId(v.id); setDuo(false); setError(null) }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Precio dúo */}
        {hasDuo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="opt-label">CANTIDAD ESPECIAL</span>
            <div className="duo-row">
              <button className={`duo-btn${!duo ? ' on' : ''}`} onClick={() => setDuo(false)}>
                1 unidad
                <small>{fmt(product.price)}</small>
              </button>
              <button className={`duo-btn${duo ? ' on' : ''}`} onClick={() => { setDuo(true); setVariantId(null) }}>
                2 unidades
                <small>{fmt(duoPrice)} · precio especial</small>
              </button>
            </div>
          </div>
        )}

        {/* Personalización */}
        {isCustom && (
          <div className="custom-box">
            <span className="custom-box-title">✦ PERSONALIZA TU PIEZA</span>
            <label className="field-label">
              Texto (máx. 12 caracteres)
              <input
                className="cust-input"
                maxLength={12}
                placeholder="TU NOMBRE"
                value={custText}
                onChange={e => setCustText(e.target.value.slice(0, 12))}
              />
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(23,25,28,.7)' }}>Color del acento</span>
              <div className="swatch-row">
                {CUSTOM_COLORS.map(c => (
                  <button
                    key={c.hex}
                    className={`swatch${custColor.hex === c.hex ? ' on' : ''}`}
                    title={c.name}
                    style={{ background: c.hex }}
                    onClick={() => setCustColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <div className="notice-error">{error}</div>}

        {/* Compra */}
        <div className="buy-row">
          {!duo && (
            <div className="qty-ctrl">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => Math.min(q + 1, Math.max(1, product.stock_quantity)))}>+</button>
            </div>
          )}
          <button className="add-btn" onClick={add} disabled={out}>
            {out ? 'AGOTADO' : 'AGREGAR AL CARRITO'}
          </button>
        </div>
        <span className="ship-note">Envíos a toda Costa Rica · Entrega 2–4 días hábiles</span>
      </div>
    </div>
  )
}
