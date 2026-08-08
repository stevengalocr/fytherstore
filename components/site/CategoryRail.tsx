import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const categoryScenes = ['/ropa.png', '/modelo1.png', '/modelo2.png']

export default function CategoryRail({ categories }: { categories: string[] }) {
  if (categories.length === 0) return null
  return (
    <section className="category-section container" aria-labelledby="category-title">
      <p className="section-label">EXPLORA</p>
      <h2 id="category-title" className="display">Encuentra tu movimiento.</h2>
      <div className="category-rail">
        {categories.map((category, index) => (
          <Link
            key={category}
            className={`category-link category-link-${(index % categoryScenes.length) + 1}`}
            href={`/catalogo?categoria=${encodeURIComponent(category)}`}
            aria-label={`Explorar la categoría ${category}`}
          >
            <span className="category-media" aria-hidden="true">
              <Image src={categoryScenes[index % categoryScenes.length]} alt="" fill sizes="(max-width: 767px) 82vw, 32vw" />
            </span>
            <span className="category-copy">
              <strong>{category}</strong>
              <ArrowUpRight aria-hidden="true" size={23} strokeWidth={1.5} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
