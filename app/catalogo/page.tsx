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
    if (products.length === 0) return <CommerceState mode={commerceMode} state="empty" />
    return <CatalogClient products={products} mode={commerceMode} initialCategory={params.categoria ?? 'Todos'} />
  } catch {
    return <CommerceState mode={commerceMode} state="error" />
  }
}
