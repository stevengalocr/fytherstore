import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="commerce-empty container">
      <div>
        <p className="section-label">FYTHER / 404</p>
        <h2 className="display">Esta página no está en movimiento.</h2>
        <p>El producto o pedido que buscas no existe o ya no está disponible.</p>
        <Link href="/catalogo" className="button button-accent">
          Ver colección
        </Link>
      </div>
    </div>
  )
}
