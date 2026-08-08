import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import type { CommerceProduct } from '@/lib/commerce/types'

export default function ProductCard({ product }: { product: CommerceProduct }) {
  const image = product.images[0]
  const soldOut = product.availability !== 'in_stock'

  return (
    <article className="product-card">
      <div className="product-media">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 560px) calc(100vw - 32px), (max-width: 1100px) calc(50vw - 32px), 380px"
            className="product-image"
          />
        ) : (
          <div className="product-fallback" aria-label={`${product.name}, imagen no disponible`}>
            <span>Imagen no disponible</span>
            <strong>Producto en catálogo</strong>
          </div>
        )}
      </div>
      <div className="product-copy">
        <div>
          {product.category && <span className="product-category">{product.category}</span>}
          <h3>{product.name}</h3>
        </div>
        <p>{formatMoney(product.price)}</p>
      </div>
      {soldOut ? (
        <button type="button" className="product-action product-action-disabled" disabled>Agotado</button>
      ) : (
        <Link href={`/catalogo/${product.slug}`} className="product-action" aria-label={`Ver producto ${product.name}`}>
          <span>Ver producto</span><ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.7} />
        </Link>
      )}
    </article>
  )
}
