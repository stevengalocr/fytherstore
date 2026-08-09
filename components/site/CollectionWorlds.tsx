import Image from 'next/image'
import Link from 'next/link'
import { ArrowDownRight } from 'lucide-react'

interface CollectionWorldsProps {
  ropaAvailable: boolean
  accesoriosAvailable: boolean
}

const COLLECTION_IMAGE_SIZES = '(max-width: 767px) calc(100vw - 32px), 50vw'
const ROPA_STATUS_ID = 'collection-world-ropa-status'
const ACCESORIOS_STATUS_ID = 'collection-world-accesorios-status'

export default function CollectionWorlds({ ropaAvailable, accesoriosAvailable }: CollectionWorldsProps) {
  return (
    <section className="collection-worlds container" aria-labelledby="collection-worlds-title">
      <div className="collection-world-heading">
        <p className="collection-world-eyebrow section-label">COLECCIONES</p>
        <h2 id="collection-worlds-title" className="collection-world-title display">
          Dos formas de acompañar tu movimiento.
        </h2>
      </div>
      <div className="collection-world-grid">
        <Link
          className="collection-world-panel"
          href="#ropa"
          aria-label="Descubrir ropa"
          aria-describedby={ropaAvailable ? undefined : ROPA_STATUS_ID}
          data-reveal
        >
          <span className="collection-world-media">
            <Image
              src="/ropa.png"
              alt="Conjunto de ropa Fyther para acompañar el movimiento"
              fill
              sizes={COLLECTION_IMAGE_SIZES}
            />
          </span>
          <span className="collection-world-copy">
            <span className="collection-world-name">Ropa</span>
            {!ropaAvailable && <span id={ROPA_STATUS_ID} className="collection-world-status">Próximamente</span>}
            <ArrowDownRight aria-hidden="true" size={22} strokeWidth={1.6} />
          </span>
        </Link>
        <Link
          className="collection-world-panel"
          href="#accesorios"
          aria-label="Ver accesorios"
          aria-describedby={accesoriosAvailable ? undefined : ACCESORIOS_STATUS_ID}
          data-reveal
        >
          <span className="collection-world-media">
            <Image
              src="/modelo2.png"
              alt="Accesorios Fyther elegidos para acompañar el movimiento"
              fill
              sizes={COLLECTION_IMAGE_SIZES}
            />
          </span>
          <span className="collection-world-copy">
            <span className="collection-world-name">Accesorios</span>
            {!accesoriosAvailable && (
              <span id={ACCESORIOS_STATUS_ID} className="collection-world-status">Próximamente</span>
            )}
            <ArrowDownRight aria-hidden="true" size={22} strokeWidth={1.6} />
          </span>
        </Link>
      </div>
    </section>
  )
}
