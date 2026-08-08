import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { commerce } from '@/lib/commerce'
import ProductDetail from './ProductDetail'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const product = await commerce.getProductBySlug(slug)
    return product ? { title: product.name, description: product.shortDescription ?? undefined } : { title: 'Producto' }
  } catch { return { title: 'Producto' } }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let product = null
  try { product = await commerce.getProductBySlug(slug) } catch { notFound() }
  if (!product) notFound()
  return <ProductDetail product={product} />
}
