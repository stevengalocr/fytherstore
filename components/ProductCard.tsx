'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { fmt, placeholderBg } from '@/lib/format'
import type { Product } from '@/lib/types'

// Un producto necesita abrirse en detalle si tiene opciones que elegir.
function needsDetail(p: Product): boolean {
  return !!(p.attributes as Record<string, unknown>)?.custom || !!(p.attributes as Record<string, unknown>)?.duo_price
}

export default function ProductCard({ product, reveal }: { product: Product; reveal?: boolean }) {
  const { addItem } = useCart()
  const router = useRouter()
  const image = product.images?.[0] ?? null
  const out = product.stock_quantity <= 0
  const isCustom = !!(product.attributes as Record<string, unknown>)?.custom

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (out) return
    if (needsDetail(product)) {
      router.push(`/catalogo/${product.slug}`)
      return
    }
    addItem({
      product_id: product.id,
      variant_id: null,
      name: product.name,
      variant_name: null,
      image,
      price: product.price,
      quantity: 1,
      slug: product.slug,
    })
    router.push('/carrito')
  }

  return (
    <Link href={`/catalogo/${product.slug}`} className="prod-card" {...(reveal ? { 'data-reveal': '' } : {})}>
      <div className="prod-card-img" style={image ? undefined : { background: placeholderBg(product.id) }}>
        {image
          ? <img src={image} alt={product.name} loading="lazy" />
          : <span className="ph-label">[ foto: {product.name.toLowerCase()} ]</span>}
        {isCustom && <span className="badge-custom">PERSONALIZABLE</span>}
        {out && <span className="badge-out">AGOTADO</span>}
      </div>
      <div className="prod-card-body">
        <span className="prod-card-cat">{(product.category ?? 'FYTHER').toUpperCase()}</span>
        <span className="prod-card-name">{product.name}</span>
        <div className="prod-card-foot">
          <span className="prod-card-price">
            {fmt(product.price)}
            {product.compare_at_price != null && product.compare_at_price > product.price && (
              <span className="price-compare">{fmt(product.compare_at_price)}</span>
            )}
          </span>
          <button className="quick-add" onClick={quickAdd} disabled={out}>
            {out ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </Link>
  )
}
