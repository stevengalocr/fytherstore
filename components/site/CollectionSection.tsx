import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { CommerceProduct } from '@/lib/commerce/types'

export interface CollectionSectionProps {
  id: 'ropa' | 'accesorios'
  eyebrow: string
  title: string
  description: string
  products: CommerceProduct[]
  emptyTitle: string
  emptyCopy: string
}

const COLLECTION_PRODUCT_IMAGE_SIZES = '(max-width: 767px) calc(100vw - 32px), (max-width: 1240px) 42vw, 500px'

const categoryActions = {
  ropa: {
    href: '/catalogo?categoria=Ropa',
    label: 'Ver toda la ropa',
  },
  accesorios: {
    href: '/catalogo?categoria=Accesorios',
    label: 'Ver todos los accesorios',
  },
} as const

export default function CollectionSection({
  id,
  eyebrow,
  title,
  description,
  products,
  emptyTitle,
  emptyCopy,
}: CollectionSectionProps) {
  const titleId = `${id}-collection-title`
  const categoryAction = categoryActions[id]

  return (
    <section id={id} className={`collection-section collection-section-${id} container`} data-reveal aria-labelledby={titleId}>
      <div className="collection-section-intro">
        <p className="collection-section-eyebrow section-label">{eyebrow}</p>
        <h2 id={titleId} className="collection-section-title display">{title}</h2>
        <p className="collection-section-description">{description}</p>
      </div>

      {products.length === 0 ? (
        <div className="collection-empty">
          <h3>{emptyTitle}</h3>
          <p>{emptyCopy}</p>
        </div>
      ) : (
        <>
          <div className="collection-product-grid">
            {products.map((product) => (
              <div key={product.id} className="collection-product-card" data-reveal>
                <ProductCard product={product} imageSizes={COLLECTION_PRODUCT_IMAGE_SIZES} />
              </div>
            ))}
          </div>
          <Link className="collection-section-link text-link" href={categoryAction.href}>
            {categoryAction.label}
            <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.7} />
          </Link>
        </>
      )}
    </section>
  )
}
