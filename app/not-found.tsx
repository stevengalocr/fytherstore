import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="cart-main">
      <div className="empty-state" style={{ padding: '90px 20px' }}>
        <h2>NO ENCONTRAMOS ESTA PÁGINA</h2>
        <p>El producto o pedido que buscas no existe o ya no está disponible.</p>
        <Link href="/catalogo" className="btn-neon-a btn-link" style={{ padding: '14px 30px', fontSize: 14 }}>
          IR AL CATÁLOGO
        </Link>
      </div>
    </div>
  )
}
