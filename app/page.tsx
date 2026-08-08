import { commerce, commerceMode } from '@/lib/commerce'
import HeroMedia from '@/components/site/HeroMedia'
import MotionTrack from '@/components/site/MotionTrack'
import CategoryRail from '@/components/site/CategoryRail'
import ProductGrid from '@/components/commerce/ProductGrid'
import CommerceState from '@/components/commerce/CommerceState'
import WhyFyther from '@/components/site/WhyFyther'
import EditorialStory from '@/components/site/EditorialStory'
import TrustFaq from '@/components/site/TrustFaq'
import FinalGlow from '@/components/site/FinalGlow'
import type { CommerceProduct } from '@/lib/commerce/types'
import { selectHomeProducts } from '@/lib/home-selection'

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
  const homeProducts = selectHomeProducts(products)

  return (
    <>
      <HeroMedia />
      <MotionTrack />
      {commerceMode === 'live' && !failed && products.length > 0 && categories.length > 0 && (
        <CategoryRail categories={categories} />
      )}
      {commerceMode === 'unconfigured' ? (
        <CommerceState state="unconfigured" />
      ) : failed ? (
        <CommerceState state="error" />
      ) : products.length === 0 ? (
        <CommerceState state="empty" />
      ) : (
        <ProductGrid products={homeProducts} />
      )}
      <WhyFyther />
      <EditorialStory />
      <TrustFaq />
      <FinalGlow />
    </>
  )
}
