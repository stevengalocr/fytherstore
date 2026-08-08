import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import BrandMark from '@/components/BrandMark'

export default function FinalGlow() {
  return (
    <section className="final-glow" data-reveal aria-labelledby="final-glow-title">
      <div className="final-glow-inner container">
        <div className="final-glow-mark" aria-hidden="true">
          <BrandMark decorative variant="alternate" sizes="(max-width: 767px) 220px, 280px" />
        </div>
        <h2 id="final-glow-title" className="display">Lo que sigue, a tu manera.</h2>
        <Link className="button button-primary" href="/catalogo">Ver la colección <ArrowUpRight aria-hidden="true" size={18} /></Link>
      </div>
    </section>
  )
}
