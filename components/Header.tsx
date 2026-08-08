'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function Header() {
  const { count } = useCart()

  return (
    <header className="site-header">
      <Link href="/" className="logo">
        <span className="logo-main">FYTHER</span>
        <span className="logo-sub">STORE</span>
      </Link>
      <nav className="site-nav">
        <Link href="/" className="nav-item">Inicio</Link>
        <Link href="/catalogo" className="nav-item">Catálogo</Link>
        <Link href="/catalogo?filtro=personalizable" className="nav-item nav-item--custom">Personalizar</Link>
        <Link href="/carrito" className="cart-btn btn-link">
          CARRITO
          <span className="cart-count">{count}</span>
        </Link>
      </nav>
    </header>
  )
}
