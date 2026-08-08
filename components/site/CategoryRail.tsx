import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function CategoryRail({ categories }: { categories: string[] }) {
  if (categories.length === 0) return null
  return (
    <section className="category-section container" aria-labelledby="category-title">
      <h2 id="category-title" className="display">Encuentra tu ritmo.</h2>
      <div className="category-rail">
        {categories.map((category) => (
          <Link key={category} href={`/catalogo?categoria=${encodeURIComponent(category)}`}>
            <span>{category}</span>
            <ArrowUpRight aria-hidden="true" size={23} strokeWidth={1.5} />
          </Link>
        ))}
      </div>
    </section>
  )
}
