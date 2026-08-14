import Image from 'next/image'
import Link from 'next/link'
import { ArrowDownRight } from 'lucide-react'

interface CollectionWorldsProps {
  ropaAvailable: boolean | null
  accesoriosAvailable: boolean | null
  accessoryTags: string[]
}

const COLLECTION_IMAGE_SIZES = '(max-width: 1024px) 82vw, 50vw'
const ROPA_STATUS_ID = 'collection-world-ropa-status'
const ACCESORIOS_STATUS_ID = 'collection-world-accesorios-status'

export default function CollectionWorlds({
  ropaAvailable,
  accesoriosAvailable,
  accessoryTags,
}: CollectionWorldsProps) {
  return (
    <section className="collection-worlds container" aria-labelledby="collection-worlds-title">
      <div className="collection-world-heading">
        <p className="collection-world-eyebrow section-label">EXPLORA</p>
        <h2 id="collection-worlds-title" className="collection-world-title display">
          Encuentra tu movimiento.
        </h2>
        <p className="collection-world-description">
          Dos formas de explorar piezas elegidas para acompañarte.
        </p>
      </div>
      <div className="collection-world-grid">
        <Link
          className="collection-world-panel"
          href="#ropa"
          aria-label="Descubrir ropa"
          aria-describedby={ropaAvailable === false ? ROPA_STATUS_ID : undefined}
          data-reveal
        >
          <span className="collection-world-media">
            <Image
              src="/collection-ropa.webp"
              alt="Selección editorial de ropa Fyther"
              fill
              sizes={COLLECTION_IMAGE_SIZES}
            />
          </span>
          <span className="collection-world-copy">
            <span className="collection-world-name">Ropa</span>
            {ropaAvailable !== true && (
              <span
                id={ropaAvailable === false ? ROPA_STATUS_ID : undefined}
                className="collection-world-status"
              >
                {ropaAvailable === false ? 'Próximamente' : 'Explorar'}
              </span>
            )}
            <ArrowDownRight aria-hidden="true" size={22} strokeWidth={1.6} />
          </span>
        </Link>
        <Link
          className="collection-world-panel"
          href="#accesorios"
          aria-label="Ver accesorios"
          aria-describedby={accesoriosAvailable === false ? ACCESORIOS_STATUS_ID : undefined}
          data-reveal
        >
          <span className="collection-world-media">
            <Image
              src="/collection-accesorios.webp"
              alt="Selección editorial de accesorios Fyther"
              fill
              sizes={COLLECTION_IMAGE_SIZES}
            />
          </span>
          <span className="collection-world-copy">
            <span className="collection-world-name">Accesorios</span>
            {accesoriosAvailable !== true && (
              <span
                id={accesoriosAvailable === false ? ACCESORIOS_STATUS_ID : undefined}
                className="collection-world-status"
              >
                {accesoriosAvailable === false ? 'Próximamente' : 'Explorar'}
              </span>
            )}
            <ArrowDownRight aria-hidden="true" size={22} strokeWidth={1.6} />
          </span>
        </Link>
      </div>
      {accessoryTags.length >= 2 && (
        <nav className="collection-world-filters" aria-label="Explorar accesorios por etiqueta">
          {accessoryTags.map((tag) => (
            <Link
              key={tag.toLocaleLowerCase('es')}
              href={`/catalogo?categoria=Accesorios&buscar=${encodeURIComponent(tag)}`}
              aria-label={`Explorar accesorios con la etiqueta ${tag}`}
            >
              {tag}
            </Link>
          ))}
        </nav>
      )}
    </section>
  )
}
