import { commerce, commerceMode } from '@/lib/commerce'
import HeroMedia from '@/components/site/HeroMedia'
import MotionTrack from '@/components/site/MotionTrack'
import CategoryRail from '@/components/site/CategoryRail'
import ProductGrid from '@/components/commerce/ProductGrid'
import CommerceState from '@/components/commerce/CommerceState'
import EditorialSections from '@/components/site/EditorialSections'
import type { CommerceProduct } from '@/lib/commerce/types'

export const revalidate = 60

export default async function HomePage() {
  let products: CommerceProduct[] = []
  let failed = false
  try {
    products = await commerce.getProducts()
  } catch {
    failed = true
  }
  const categories = [...new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))]
  const featured = products.filter((product) => product.featured).slice(0, 3)

  return (
    <>
      <HeroMedia />
      <MotionTrack />
      {commerceMode === 'unconfigured' ? (
        <CommerceState state="unconfigured" />
      ) : failed ? (
        <CommerceState state="error" />
      ) : products.length === 0 ? (
        <CommerceState state="empty" />
      ) : (
        <>
          <CategoryRail categories={categories} />
          <ProductGrid products={featured.length > 0 ? featured : products.slice(0, 3)} />
        </>
      )}
      <EditorialSections />
    </>
  )
}
