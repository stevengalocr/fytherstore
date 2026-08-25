import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const tickerItems = ['Productos originales', 'SINPE', 'Apartados', 'Correos de Costa Rica']

export default function SalesRail() {
  return (
    <section id="fyther" className="sales-rail" data-reveal aria-labelledby="sales-rail-title">
      <div className="sales-rail-content container">
        <div className="sales-rail-copy">
          <h2 id="sales-rail-title">Tu próximo favorito ya está aquí.</h2>
          <p>Prendas y accesorios originales, con SINPE y opción de apartado.</p>
        </div>
        <Link href="/catalogo" className="sales-rail-cta">
          Ver la colección
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
      <div className="sales-ticker" aria-hidden="true">
        <div className="sales-ticker-track">
          {[0, 1].map((group) => (
            <div className="sales-ticker-group" key={group}>
              {tickerItems.map((item) => (
                <span className="sales-ticker-item" key={item}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
