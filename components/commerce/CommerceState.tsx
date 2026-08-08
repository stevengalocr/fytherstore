import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, ArrowUpRight } from 'lucide-react'
import BrandMark from '@/components/BrandMark'
import RetryCommerceButton from '@/components/commerce/RetryCommerceButton'

type State = 'empty' | 'error' | 'unconfigured'

export default function CommerceState({ state }: { state: State }) {
  if (state === 'unconfigured') {
    return (
      <section className="commerce-state commerce-state-preparing container" aria-labelledby="commerce-preparing-title" data-reveal>
        <div className="commerce-state-mark" aria-hidden="true">
          <BrandMark decorative variant="alternate" sizes="260px" />
        </div>
        <div className="commerce-state-copy">
          <p className="section-label">MUY PRONTO</p>
          <h2 id="commerce-preparing-title" className="display">Estamos preparando la colección.</h2>
          <p>Estamos eligiendo cada pieza con calma para que encuentres una selección que se sienta bien desde el primer movimiento.</p>
          <Link className="button button-ghost" href="/#fyther">Conocer Fyther</Link>
        </div>
      </section>
    )
  }

  if (state === 'error') {
    return (
      <section className="commerce-state commerce-state-error container" role="alert" aria-labelledby="commerce-error-title">
        <AlertCircle aria-hidden="true" size={28} strokeWidth={1.6} />
        <h2 id="commerce-error-title" className="display">No pudimos cargar la colección.</h2>
        <p>La conexión se interrumpió por un momento. Puedes intentarlo otra vez.</p>
        <div className="commerce-state-actions">
          <RetryCommerceButton />
          <Link className="button button-ghost" href="/">Volver al inicio</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="commerce-state commerce-state-empty container" aria-labelledby="commerce-empty-title" data-reveal>
      <div className="commerce-state-media">
        <Image
          src="/modelo2.png"
          alt="Mujer con ropa activa en un espacio de luz cyan"
          fill
          sizes="(max-width: 767px) calc(100vw - 32px), 44vw"
        />
      </div>
      <div className="commerce-state-copy">
        <p className="section-label">SELECCIÓN FYTHER</p>
        <h2 id="commerce-empty-title" className="display">La colección vuelve pronto.</h2>
        <p>Estamos dando espacio a lo que sigue: prendas elegidas para acompañarte con comodidad, intención y libertad.</p>
        <Link className="text-link" href="/#fyther">Conocer Fyther <ArrowUpRight aria-hidden="true" size={18} /></Link>
      </div>
    </section>
  )
}
