import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/products'
import ProductDetail from './ProductDetail'

export const revalidate = 60

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  return (
    <div className="detail-main">
      <Link href="/catalogo" className="back-link">← Volver al catálogo</Link>
      <ProductDetail product={product} />
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  return {
    title: product ? `${product.name} · FYTHER STORE` : 'Producto · FYTHER STORE',
    description: product?.short_description ?? undefined,
  }
}
