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
            sizes="(max-width: 767px) 86vw, (max-width: 1100px) 45vw, 31vw"
            className="product-image"
          />
        ) : (
          <div className="product-fallback" aria-label={`${product.name}, imagen no disponible`}>
            <span>Imagen no disponible</span>
            <strong>FYTHER</strong>
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
        <button type="button" className="product-action" disabled>Agotado</button>
      ) : (
        <Link href={`/catalogo/${product.slug}`} className="product-action" aria-label={`Ver producto ${product.name}`}>
          Ver producto <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.7} />
        </Link>
      )}
    </article>
  )
}
