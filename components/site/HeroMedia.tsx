import Image from 'next/image'
import Link from 'next/link'

export default function HeroMedia() {
  return (
    <section
      id="descubrir"
      className="hero-journey hero-journey-static"
      aria-labelledby="hero-title"
      data-scene="hero"
      data-hero-static="true"
    >
      <div className="hero-section hero-scene">
        <div className="hero-media">
          <picture className="hero-still-frame">
            <source media="(max-width: 767px)" srcSet="/editorial/hero-open-suitcase-mobile.webp" />
            <Image
              src="/editorial/hero-open-suitcase.webp"
              alt="Maletín Fyther abierto con una selección de ropa y accesorios deportivos"
              fill
              priority
              sizes="100vw"
            />
          </picture>
        </div>
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-content container">
          <p>PARA MOVERTE, COMPARTIR Y SENTIRTE BIEN</p>
          <h1 id="hero-title" className="display">Muévete a tu manera.</h1>
          <p className="hero-description">Ropa y accesorios elegidos para moverte, compartir y sentirte bien.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#ropa">Descubrir ropa</Link>
            <Link className="button button-secondary" href="#accesorios">Ver accesorios</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
