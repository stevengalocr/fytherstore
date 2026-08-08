'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import CommerceState from '@/components/commerce/CommerceState'
import type { CommerceMode, CommerceProduct } from '@/lib/commerce/types'

export default function CatalogClient({ products, mode, initialCategory }: {
  products: CommerceProduct[]
  mode: CommerceMode
  initialCategory: string
}) {
  const categories = ['Todos', ...new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))]
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : 'Todos')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    const filtered = products.filter((product) =>
      (category === 'Todos' || product.category === category)
      && (!normalized || `${product.name} ${product.shortDescription ?? ''}`.toLocaleLowerCase('es').includes(normalized)))
    return [...filtered].sort((a, b) => {
      if (sort === 'price-asc') return a.price.amount - b.price.amount
      if (sort === 'price-desc') return b.price.amount - a.price.amount
      if (sort === 'name') return a.name.localeCompare(b.name, 'es')
      return Number(b.featured) - Number(a.featured)
    })
  }, [category, products, query, sort])

  return (
    <div className="catalog-page">
      <header className="catalog-hero container">
        <p className="section-label">FYTHER / COLLECTION</p>
        <h1 className="display">Active essentials.</h1>
        <p>Encuentra piezas para tu siguiente movimiento.</p>
      </header>
      {mode === 'demo' && <CommerceState mode="demo" state="demo" />}
      <div className="catalog-tools container">
        <div className="category-filters" aria-label="Filtrar por categoría">
          {categories.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <div className="catalog-controls">
          <label className="search-control">
            <span className="sr-only">Buscar productos</span>
            <Search aria-hidden="true" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
          </label>
          <label className="sort-control">
            <span className="sr-only">Ordenar productos</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre</option>
            </select>
          </label>
        </div>
      </div>
      <section className="catalog-results container" aria-live="polite">
        <p>{visible.length} {visible.length === 1 ? 'resultado' : 'resultados'}</p>
        {visible.length > 0 ? (
          <div className="catalog-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className="catalog-no-results"><h2 className="display">Sin coincidencias.</h2><p>Prueba otra categoría o búsqueda.</p></div>
        )}
      </section>
    </div>
  )
}
