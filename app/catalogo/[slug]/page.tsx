import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { commerce } from '@/lib/commerce'
import ProductDetail from './ProductDetail'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await commerce.getProductBySlug(slug)
  return product ? { title: product.name, description: product.shortDescription ?? undefined } : { title: 'Producto' }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await commerce.getProductBySlug(slug)
  if (!product) notFound()
  return <ProductDetail product={product} />
}
