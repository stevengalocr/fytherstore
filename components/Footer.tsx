import Image from 'next/image'
import Link from 'next/link'
import BrandMark from '@/components/BrandMark'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-media">
          <Image
            src="/editorial/footer-movement.webp"
            alt="Dos mujeres descansan juntas después de una sesión de movimiento"
            width={1800}
            height={900}
            sizes="(max-width: 767px) calc(100vw - 32px), 56vw"
          />
        </div>
        <div className="footer-content">
          <div className="footer-brand">
            <Link href="/" className="footer-wordmark" aria-label="Fyther Store, inicio">
              <BrandMark decorative variant="alternate" sizes="176px" />
            </Link>
            <p>Muévete a tu manera.</p>
          </div>
          <ul className="footer-trust" aria-label="Servicio Fyther">
            <li>Productos originales</li>
            <li>Correos de Costa Rica</li>
            <li>Sinpe y apartados</li>
            <li>Respuesta en menos de 24 horas</li>
          </ul>
          <div className="footer-links" aria-label="Enlaces del pie de página">
            <div>
              <strong>Tienda</strong>
              <Link href="/catalogo?categoria=Ropa">Ropa</Link>
              <Link href="/catalogo?categoria=Accesorios">Accesorios</Link>
              <Link href="/carrito">Carrito</Link>
              <Link href="/envios-apartados">Seguir pedido</Link>
            </div>
            <div>
              <strong>Información</strong>
              <Link href="/envios-apartados">Envíos y apartados</Link>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos</Link>
            </div>
            <div>
              <strong>Contacto</strong>
              <a href="mailto:fytherstore@gmail.com">fytherstore@gmail.com</a>
            </div>
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
