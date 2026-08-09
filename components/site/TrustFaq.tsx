import Link from 'next/link'

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
            <summary>¿Los productos son originales?</summary>
            <p>Sí. Son productos seleccionados, originales y de marcas reconocidas.</p>
          </details>
          <details>
            <summary>¿Cómo realizan los envíos?</summary>
            <p>Enviamos por Correos de Costa Rica. Confirmamos la cobertura y el costo para cada pedido; consulta <Link href="/envios-apartados">envíos y apartados</Link>.</p>
          </details>
          <details>
            <summary>¿Cuánto tardan en responder?</summary>
            <p>Respondemos tus consultas y confirmamos pedidos en menos de 24 horas.</p>
          </details>
          <details>
            <summary>¿Puedo apartar un producto?</summary>
            <p>Sí. Los apartados se coordinan directamente antes de reservar el producto.</p>
          </details>
          <details>
            <summary>¿Cómo consulto mi pedido?</summary>
            <p>La confirmación incluye un enlace único con la información para seguir tu pedido.</p>
          </details>
        </div>
      </div>
    </section>
  )
}
