import type { Metadata } from 'next'
import { commerce, commerceMode } from '@/lib/commerce'
import CatalogClient from './CatalogClient'
import CommerceState from '@/components/commerce/CommerceState'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Colección',
  description: 'Explora la colección activa de Fyther Store.',
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const params = await searchParams
  try {
    const products = await commerce.getProducts()
    if (commerceMode === 'unconfigured') return <><CatalogHeader /><CommerceState state="unconfigured" /></>
    if (products.length === 0) return <><CatalogHeader /><CommerceState state="empty" /></>
    return <CatalogClient products={products} initialCategory={params.categoria ?? 'Todos'} />
  } catch {
    return <CommerceState state="error" />
  }
}

function CatalogHeader() {
  return (
    <header className="catalog-hero container">
      <p className="section-label">FYTHER / COLECCIÓN</p>
      <h1 className="display">Encuentra algo para ti.</h1>
      <p>Ropa y accesorios elegidos para moverte y disfrutar cada día.</p>
    </header>
  )
}
