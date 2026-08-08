import ProductCard from '@/components/ProductCard'
import type { CommerceProduct } from '@/lib/commerce/types'

const HOME_PRODUCT_IMAGE_SIZES = '(max-width: 767px) calc(100vw - 32px), (max-width: 1240px) 42vw, 500px'

export default function ProductGrid({ products, title = 'Una selección para ti.' }: { products: CommerceProduct[]; title?: string }) {
  return (
    <section className="product-section container" aria-labelledby="product-grid-title">
      <div className="stacked-heading">
        <h2 id="product-grid-title" className="display">{title}</h2>
        <p>Piezas elegidas para acompañar tu movimiento diario.</p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} imageSizes={HOME_PRODUCT_IMAGE_SIZES} />
        ))}
      </div>
    </section>
  )
}
