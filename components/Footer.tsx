import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Link href="/" className="footer-wordmark">FYTHER</Link>
          <p>Ropa y artículos deportivos para moverte con confianza.</p>
        </div>
        <div className="footer-links" aria-label="Enlaces del pie de página">
          <div>
            <strong>Tienda</strong>
            <Link href="/catalogo">Colección</Link>
            <Link href="/carrito">Carrito</Link>
          </div>
          <div>
            <strong>Información</strong>
            <Link href="/envios-cambios">Envíos y cambios</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos</Link>
          </div>
          <div>
            <strong>Contacto</strong>
            <a href="https://wa.me/50672874779" target="_blank" rel="noreferrer">WhatsApp</a>
            <a href="mailto:stevengalocr@gmail.com">Correo</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Fyther Store</span>
        <span>Costa Rica</span>
      </div>
    </footer>
  )
}
