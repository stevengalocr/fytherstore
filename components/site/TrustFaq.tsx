import Link from 'next/link'
import FaqAccordion, { type FaqItem } from '@/components/site/FaqAccordion'

const faqItems: FaqItem[] = [
  {
    question: '¿Los productos son originales?',
    answer: 'Sí. Todos nuestros productos son originales y de marcas reconocidas.',
  },
  {
    question: '¿Cómo realizan los envíos?',
    answer: (
      <>
        Enviamos por Correos de Costa Rica. Confirmamos la cobertura y el costo para cada pedido; consulta{' '}
        <Link href="/envios-apartados">envíos y apartados</Link>.
      </>
    ),
  },
  {
    question: '¿Cuánto tardan en responder?',
    answer: 'Respondemos tus consultas y confirmamos pedidos en menos de 24 horas.',
  },
  {
    question: '¿Puedo apartar un producto?',
    answer: 'Sí. Los apartados se coordinan directamente antes de reservar el producto.',
  },
  {
    question: '¿Cómo consulto mi pedido?',
    answer: 'La confirmación incluye un enlace único de seguimiento para consultar el estado de tu pedido.',
  },
]

export default function TrustFaq() {
  return (
    <section id="preguntas" className="trust-faq container" data-reveal aria-labelledby="trust-faq-title">
      <div className="trust-faq-layout">
        <div className="trust-faq-heading">
          <p className="section-label">ANTES DE ELEGIR</p>
          <h2 id="trust-faq-title" className="display">Preguntas frecuentes</h2>
        </div>
        <FaqAccordion items={faqItems} />
      </div>
    </section>
  )
}
