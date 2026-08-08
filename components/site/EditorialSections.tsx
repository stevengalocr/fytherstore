import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function EditorialSections() {
  return (
    <>
      <section className="manifesto-section dark-surface" id="movimiento">
        <div className="container manifesto-grid">
          <p className="manifesto-lead display">El movimiento no pide permiso.</p>
          <div>
            <h2 className="display">Built for the next move.</h2>
            <p>Fyther selecciona piezas para entrenar, salir y seguir. Menos ruido. Más intención en cada elección.</p>
          </div>
        </div>
      </section>

      <section className="editorial-split container">
        <div className="editorial-image">
          <Image src="/home.jpeg" alt="Escena de campaña Fyther con equipaje deportivo" fill sizes="(max-width: 767px) 100vw, 58vw" />
        </div>
        <div className="editorial-copy">
          <h2 className="display">La confianza también se viste.</h2>
          <p>Una colección pensada para acompañar tu rutina sin dictarla.</p>
          <Link href="/catalogo" className="text-link">Explorar colección <ArrowUpRight aria-hidden="true" size={18} /></Link>
        </div>
      </section>

      <section className="principles-section container" aria-labelledby="principles-title">
        <h2 id="principles-title" className="display">Lo esencial, bien elegido.</h2>
        <div className="principles-list">
          <div><strong>Selección</strong><p>Una tienda enfocada en piezas deportivas con propósito.</p></div>
          <div><strong>Claridad</strong><p>Disponibilidad, variantes y precios visibles antes de decidir.</p></div>
          <div><strong>Continuidad</strong><p>Del carrito al seguimiento, el recorrido conserva su contexto.</p></div>
        </div>
      </section>

      <section className="faq-section container" id="preguntas" aria-labelledby="faq-title">
        <h2 id="faq-title" className="display">Antes de moverte.</h2>
        <div className="faq-list">
          <details><summary>¿De dónde proviene el catálogo?</summary><p>Productos, variantes, precios y disponibilidad se publican desde BilBildin.</p></details>
          <details><summary>¿Cómo confirmo disponibilidad?</summary><p>En la tienda conectada, cada detalle refleja la disponibilidad registrada en BilBildin.</p></details>
          <details><summary>¿Dónde puedo consultar mi pedido?</summary><p>La confirmación incluye un enlace único al seguimiento del pedido.</p></details>
          <details><summary>¿Cómo confirmo envíos o cambios?</summary><p>Consulta la página de envíos y cambios o contacta a Fyther antes de comprar.</p></details>
        </div>
      </section>

      <section className="final-cta dark-surface">
        <div className="container">
          <h2 className="display">Your next move starts here.</h2>
          <Link className="button button-accent" href="/catalogo">Shop the drop</Link>
        </div>
      </section>
    </>
  )
}
