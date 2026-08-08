import ProductCard from '@/components/ProductCard'
import type { CommerceProduct } from '@/lib/commerce/types'

export default function ProductGrid({ products, title = 'The active edit.' }: { products: CommerceProduct[]; title?: string }) {
  return (
    <section className="product-section container" aria-labelledby="product-grid-title">
      <div className="stacked-heading">
        <h2 id="product-grid-title" className="display">{title}</h2>
        <p>Una selección para el movimiento diario.</p>
      </div>
      <div className="product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  )
}
