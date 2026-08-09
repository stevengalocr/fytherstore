import { commerce, commerceMode } from '@/lib/commerce'
import HeroMedia from '@/components/site/HeroMedia'
import MotionTrack from '@/components/site/MotionTrack'
import CollectionWorlds from '@/components/site/CollectionWorlds'
import CollectionSection from '@/components/site/CollectionSection'
import CommerceState from '@/components/commerce/CommerceState'
import EditorialStory from '@/components/site/EditorialStory'
import TrustFaq from '@/components/site/TrustFaq'
import type { CommerceProduct } from '@/lib/commerce/types'
import { splitProductsByWorld } from '@/lib/home-selection'

export const revalidate = 60

export default async function HomePage() {
  let products: CommerceProduct[] = []
  let failed = false
  try {
    products = await commerce.getProducts()
  } catch {
    failed = true
  }
  const { ropa, accesorios } = splitProductsByWorld(products)
  const commerceUnavailable = commerceMode === 'unconfigured' || failed

  return (
    <>
      <HeroMedia />
      <MotionTrack />
      <CollectionWorlds
        ropaAvailable={!commerceUnavailable && ropa.length > 0}
        accesoriosAvailable={!commerceUnavailable && accesorios.length > 0}
      />
      {commerceUnavailable ? (
        <CommerceState state={commerceMode === 'unconfigured' ? 'unconfigured' : 'error'} />
      ) : (
        <CollectionSection
          id="ropa"
          eyebrow="ROPA"
          title="Ropa para sentirte tú."
          description="Prendas elegidas para entrenar, caminar y compartir tu ritmo."
          products={ropa}
          emptyTitle="Estamos preparando esta selección."
          emptyCopy="Muy pronto encontrarás prendas elegidas para moverte a tu manera."
        />
      )}
      <EditorialStory />
      {!commerceUnavailable && (
        <CollectionSection
          id="accesorios"
          eyebrow="ACCESORIOS"
          title="Detalles que siguen tu ritmo."
          description="Accesorios originales y útiles para organizar, celebrar y acompañar cada meta."
          products={accesorios}
          emptyTitle="Estamos preparando los detalles."
          emptyCopy="La selección de accesorios estará disponible pronto."
        />
      )}
      <TrustFaq />
    </>
  )
}
