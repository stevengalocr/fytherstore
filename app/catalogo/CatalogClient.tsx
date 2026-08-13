'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Search } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { CommerceProduct } from '@/lib/commerce/types'
import { normalizeCollectionCategory } from '@/lib/home-selection'

const CATALOG_PRODUCT_IMAGE_SIZES = '(max-width: 560px) calc(100vw - 32px), (max-width: 1100px) calc(50vw - 32px), 380px'
const CATEGORIES = ['Todos', 'Ropa', 'Accesorios'] as const
type CatalogCategory = (typeof CATEGORIES)[number]

function canonicalCategory(category: string): CatalogCategory {
  return CATEGORIES.find((candidate) => candidate === category) ?? 'Todos'
}

export default function CatalogClient({ products, initialCategory, initialQuery }: {
  products: CommerceProduct[]
  initialCategory: string
  initialQuery: string
}) {
  const canonicalInitialCategory = canonicalCategory(initialCategory)
  const [category, setCategory] = useState<CatalogCategory>(canonicalInitialCategory)
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState('featured')

  useEffect(() => {
    setCategory(canonicalInitialCategory)
  }, [canonicalInitialCategory])

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  function clearFilters() {
    setCategory('Todos')
    setQuery('')
    setSort('featured')
  }

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    const normalizedCategory = category === 'Todos' ? '' : normalizeCollectionCategory(category)
    const filtered = products.filter((product) => {
      const searchable = [product.name, product.shortDescription ?? '', ...product.tags]
        .join(' ')
        .toLocaleLowerCase('es')
      return (category === 'Todos' || normalizeCollectionCategory(product.category) === normalizedCategory)
        && (!normalized || searchable.includes(normalized))
    })
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
        <p className="section-label">FYTHER / COLECCIÓN</p>
        <h1 className="display">Encuentra algo para ti.</h1>
        <p>Ropa y accesorios elegidos para moverte y disfrutar cada día.</p>
      </header>
      <div className="catalog-tools container">
        <div className="category-filters" role="group" aria-label="Filtrar por categoría">
          {CATEGORIES.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <div className="catalog-controls">
          <label className="search-control">
            <span className="sr-only">Buscar productos</span>
            <Search aria-hidden="true" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar productos" />
          </label>
          <label className="sort-control">
            <span className="sr-only">Ordenar productos</span>
            <ArrowDownUp aria-hidden="true" size={17} />
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre</option>
            </select>
          </label>
        </div>
      </div>
      <section className="catalog-results container" aria-label="Resultados del catálogo">
        <p className="catalog-result-count" aria-live="polite" aria-atomic="true">
          {visible.length} {visible.length === 1 ? 'resultado' : 'resultados'}
        </p>
        {visible.length > 0 ? (
          <div className="catalog-grid" role="list" aria-label="Productos">
            {visible.map((product) => (
              <div key={product.id} className="catalog-grid-item" role="listitem">
                <ProductCard product={product} imageSizes={CATALOG_PRODUCT_IMAGE_SIZES} />
              </div>
            ))}
          </div>
        ) : (
          <div className="catalog-no-results">
            <p className="section-label">BUSQUEMOS DE NUEVO</p>
            <h2 className="display">No encontramos esa combinación.</h2>
            <p>Prueba con otra palabra o vuelve a ver toda la colección.</p>
            <button type="button" className="button button-ghost" onClick={clearFilters}>Limpiar filtros</button>
          </div>
        )}
      </section>
    </div>
  )
}
