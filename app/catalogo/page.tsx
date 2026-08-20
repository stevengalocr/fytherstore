import type { Metadata } from 'next'
import { commerce, commerceMode } from '@/lib/commerce'
import CatalogClient from './CatalogClient'
import CommerceState from '@/components/commerce/CommerceState'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Colección',
  description: 'Explora la colección activa de Fyther Store.',
}

type CatalogSearchParams = {
  categoria?: string | string[]
  buscar?: string | string[]
}

function firstParam(value: string | string[] | undefined, fallback = '') {
  const selected = Array.isArray(value) ? value[0] : value
  return (selected ?? fallback).trim().slice(0, 80)
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const params = await searchParams
  const initialCategory = firstParam(params.categoria, 'Todos')
  const initialQuery = firstParam(params.buscar)
  try {
    const products = await commerce.getProducts()
    if (commerceMode === 'unconfigured') return <CommerceState state="unconfigured" />
    if (products.length === 0) return <CommerceState state="empty" />
    return <CatalogClient products={products} initialCategory={initialCategory} initialQuery={initialQuery} />
  } catch {
    return <CommerceState state="error" />
  }
}
