import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export default function TrustFaq() {
  return (
    <section id="preguntas" className="trust-faq container" data-reveal aria-labelledby="trust-faq-title">
      <div className="trust-faq-layout">
        <div className="trust-faq-heading">
          <p className="section-label">ANTES DE ELEGIR</p>
          <h2 id="trust-faq-title" className="display">Preguntas frecuentes</h2>
        </div>
        <div className="trust-faq-list">
          <details>
            <summary><span>¿Los productos son originales?</span><ChevronDown aria-hidden="true" size={20} strokeWidth={1.7} /></summary>
            <div className="trust-faq-answer"><p>Sí. Son productos seleccionados, originales y de marcas reconocidas.</p></div>
          </details>
          <details>
            <summary><span>¿Cómo realizan los envíos?</span><ChevronDown aria-hidden="true" size={20} strokeWidth={1.7} /></summary>
            <div className="trust-faq-answer"><p>Enviamos por Correos de Costa Rica. Confirmamos la cobertura y el costo para cada pedido; consulta <Link href="/envios-apartados">envíos y apartados</Link>.</p></div>
          </details>
          <details>
            <summary><span>¿Cuánto tardan en responder?</span><ChevronDown aria-hidden="true" size={20} strokeWidth={1.7} /></summary>
            <div className="trust-faq-answer"><p>Respondemos tus consultas y confirmamos pedidos en menos de 24 horas.</p></div>
          </details>
          <details>
            <summary><span>¿Puedo apartar un producto?</span><ChevronDown aria-hidden="true" size={20} strokeWidth={1.7} /></summary>
            <div className="trust-faq-answer"><p>Sí. Los apartados se coordinan directamente antes de reservar el producto.</p></div>
          </details>
          <details>
            <summary><span>¿Cómo consulto mi pedido?</span><ChevronDown aria-hidden="true" size={20} strokeWidth={1.7} /></summary>
            <div className="trust-faq-answer"><p>La confirmación incluye un enlace único con la información para seguir tu pedido.</p></div>
          </details>
        </div>
      </div>
    </section>
  )
}
