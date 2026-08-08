import Link from 'next/link'

const trustPoints = ['Envíos claros', 'Cambios con acompañamiento', 'Soporte cercano']

export default function TrustFaq() {
  return (
    <section id="preguntas" className="trust-faq container" data-reveal aria-labelledby="trust-faq-title">
      <div className="trust-chips" aria-label="Compromisos de servicio">
        {trustPoints.map((point) => <span key={point}>{point}</span>)}
      </div>
      <div className="trust-faq-layout">
        <div className="trust-faq-heading">
          <p className="section-label">ANTES DE ELEGIR</p>
          <h2 id="trust-faq-title" className="display">Preguntas, sin vueltas.</h2>
        </div>
        <div className="trust-faq-list">
          <details>
            <summary>¿De dónde viene la colección?</summary>
            <p>Los productos, variantes, precios y disponibilidad publicados vienen de BilBildin.</p>
          </details>
          <details>
            <summary>¿Cómo consulto mi pedido?</summary>
            <p>La confirmación incluye un enlace único para consultar el seguimiento de tu pedido.</p>
          </details>
          <details>
            <summary>¿Cómo funcionan envíos y cambios?</summary>
            <p>Consulta la información vigente en <Link href="/envios-cambios">Envíos y cambios</Link> antes de completar tu compra.</p>
          </details>
        </div>
      </div>
    </section>
  )
}
