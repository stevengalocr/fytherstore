import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-main">FYTHER</span>
            <span className="footer-logo-sub">STORE</span>
          </div>
          <span className="footer-tag">
            Ropa deportiva y accesorios premium. Hecho con precisión, pensado para atletas.
          </span>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <span className="footer-col-title">TIENDA</span>
            <Link href="/catalogo" className="footer-link">Catálogo</Link>
            <Link href="/catalogo?filtro=personalizable" className="footer-link">Personalizar</Link>
            <Link href="/carrito" className="footer-link">Carrito</Link>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">AYUDA</span>
            <a href="https://wa.me/50672874779" target="_blank" rel="noopener noreferrer" className="footer-link">WhatsApp</a>
            <a href="mailto:stevengalocr@gmail.com" className="footer-link">Contacto</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 FYTHER STORE · Costa Rica</span>
        <span>Precios en colones (₡) · IVA incluido</span>
      </div>
    </footer>
  )
}
