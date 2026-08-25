import { getImageProps } from 'next/image'
import Link from 'next/link'

const heroAlt = 'Maleta Fyther abierta con prendas, calzado y accesorios deportivos'

export default function HeroMedia() {
  const { props: desktopImageProps } = getImageProps({
    src: '/editorial/hero-product-campaign-v3.webp',
    alt: heroAlt,
    fill: true,
    sizes: '100vw',
    loading: 'eager',
  })
  const { props: { srcSet: mobileSrcSet } } = getImageProps({
    src: '/editorial/hero-product-campaign-v3-mobile.webp',
    alt: heroAlt,
    width: 1200,
    height: 1500,
    sizes: '100vw',
  })

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
            <source media="(max-width: 767px)" sizes="100vw" srcSet={mobileSrcSet} />
            <img {...desktopImageProps} alt={heroAlt} fetchPriority="high" />
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
