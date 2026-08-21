import Image from 'next/image'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import BrandMark from '@/components/BrandMark'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-media">
          <Image
            src="/editorial/footer-community-v2.webp"
            alt="Tres amigas comparten un momento después de entrenar"
            width={1920}
            height={1080}
            sizes="(max-width: 767px) calc(100vw - 32px), 56vw"
          />
        </div>
        <div className="footer-content">
          <div className="footer-brand">
            <Link href="/" className="footer-wordmark" aria-label="Fyther Store, inicio">
              <BrandMark decorative sizes="148px" />
            </Link>
            <p>Muévete a tu manera.</p>
          </div>
          <ul className="footer-trust" aria-label="Servicio Fyther">
            <li>Productos originales</li>
            <li>Correos de Costa Rica</li>
            <li>Sinpe y apartados</li>
            <li>Respuesta en menos de 24 horas</li>
          </ul>
          <nav className="footer-links" aria-label="Explorar Fyther">
            <div aria-labelledby="footer-store-heading">
              <strong id="footer-store-heading">Tienda</strong>
              <Link href="/catalogo?categoria=Ropa">Ropa</Link>
              <Link href="/catalogo?categoria=Accesorios">Accesorios</Link>
              <Link href="/carrito">Carrito</Link>
              <Link href="/envios-apartados">Seguir pedido</Link>
            </div>
            <div aria-labelledby="footer-info-heading">
              <strong id="footer-info-heading">Información</strong>
              <Link href="/envios-apartados">Envíos y apartados</Link>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos</Link>
            </div>
          </nav>
          <div className="footer-contact">
            <strong>Contacto</strong>
            <a href="mailto:fytherstore@gmail.com">
              <Mail size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>fytherstore@gmail.com</span>
            </a>
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
