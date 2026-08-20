import Image from 'next/image'
import Link from 'next/link'
import { formatMoney } from '@/lib/format'
import type { CommerceProduct } from '@/lib/commerce/types'

interface ProductCardProps {
  product: CommerceProduct
  imageSizes?: string
}

export default function ProductCard({ product, imageSizes = '100vw' }: ProductCardProps) {
  const image = product.images[0]
  const soldOut = product.availability !== 'in_stock'
  const metadata = product.brand ?? product.category

  return (
    <Link
      href={`/catalogo/${product.slug}`}
      className="product-card"
      aria-label={`Ver producto ${product.name}`}
    >
      <div className="product-media">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={imageSizes}
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
          {metadata && <span className="product-category">{metadata}</span>}
          <h3>{product.name}</h3>
        </div>
        <div className="product-prices">
          <span className="product-price">{formatMoney(product.price)}</span>
          {product.compareAtPrice ? (
            <del className="product-compare-price">{formatMoney(product.compareAtPrice)}</del>
          ) : null}
        </div>
      </div>
      {soldOut ? (
        <span className="product-action product-action-disabled">Agotado</span>
      ) : (
        <span className="product-action">Ver producto</span>
      )}
    </Link>
  )
}
