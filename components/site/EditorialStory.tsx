import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function EditorialStory() {
  return (
    <section className="editorial-story container" data-reveal aria-labelledby="editorial-story-title">
      <div className="editorial-story-media">
        <Image
          src="/modelo1.png"
          alt="Mujer entrenando en un espacio de luz cyan y rosa"
          fill
          sizes="(max-width: 767px) calc(100vw - 32px), 100vw"
        />
        <div className="editorial-story-copy">
          <p className="section-label">A TU RITMO</p>
          <h2 id="editorial-story-title" className="display">Sentirte bien también cuenta.</h2>
          <p>Prendas para acompañar tu rutina sin dictarla.</p>
          <Link className="text-link" href="/catalogo">Ver la colección <ArrowUpRight aria-hidden="true" size={18} /></Link>
        </div>
      </div>
    </section>
  )
}
