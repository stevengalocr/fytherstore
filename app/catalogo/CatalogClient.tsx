'use client'

import { Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/types'

type Props = { products: Product[]; categories: string[] }

const ORDENES: Array<[string, string]> = [
  ['destacados', 'Destacados'],
  ['precio-asc', 'Precio: menor a mayor'],
  ['precio-desc', 'Precio: mayor a menor'],
  ['nombre', 'Nombre A–Z'],
]

function CatalogInner({ products, categories }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const cat = params.get('cat') ?? 'todos'
  const filtro = params.get('filtro')
  const orden = params.get('orden') ?? 'destacados'

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value === null) next.delete(key)
    else next.set(key, value)
    router.replace(`/catalogo${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  const list = useMemo(() => {
    let l = products
    if (filtro === 'personalizable') {
      l = l.filter(p => !!(p.attributes as Record<string, unknown>)?.custom)
    } else if (cat !== 'todos') {
      l = l.filter(p => p.category === cat)
    }
    l = l.slice()
    if (orden === 'precio-asc') l.sort((a, b) => a.price - b.price)
    else if (orden === 'precio-desc') l.sort((a, b) => b.price - a.price)
    else if (orden === 'nombre') l.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    else l.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    return l
  }, [products, cat, filtro, orden])

  return (
    <div className="page-main">
      <h1 className="page-title">CATÁLOGO</h1>
      <p className="result-count">{list.length} {list.length === 1 ? 'producto' : 'productos'}</p>

      <div className="catalog-toolbar">
        <div className="chip-row">
          <button
            className={`chip${cat === 'todos' && !filtro ? ' on' : ''}`}
            onClick={() => { setParam('filtro', null); setParam('cat', null) }}
          >
            Todos
          </button>
          {categories.map(c => (
            <button
              key={c}
              className={`chip${cat === c && !filtro ? ' on' : ''}`}
              onClick={() => { setParam('filtro', null); setParam('cat', c) }}
            >
              {c}
            </button>
          ))}
          <button
            className={`chip${filtro === 'personalizable' ? ' on' : ''}`}
            onClick={() => { setParam('cat', null); setParam('filtro', 'personalizable') }}
          >
            ✦ Personalizables
          </button>
        </div>
        <select
          className="sort-select"
          value={orden}
          onChange={e => setParam('orden', e.target.value === 'destacados' ? null : e.target.value)}
        >
          {ORDENES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <h2>SIN PRODUCTOS POR AQUÍ</h2>
          <p>
            {products.length === 0
              ? 'El catálogo se gestiona desde el panel de BilBildin. Agrega productos y aparecerán aquí automáticamente.'
              : 'No hay productos que coincidan con este filtro.'}
          </p>
        </div>
      ) : (
        <div className="prod-grid">
          {list.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}

export default function CatalogClient(props: Props) {
  // useSearchParams requiere Suspense en App Router
  return (
    <Suspense fallback={<div className="page-main"><h1 className="page-title">CATÁLOGO</h1></div>}>
      <CatalogInner {...props} />
    </Suspense>
  )
}
