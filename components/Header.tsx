'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import BrandMark from '@/components/BrandMark'

export default function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const countLabel = `${count} ${count === 1 ? 'producto' : 'productos'}`

  useEffect(() => {
    if (!open) {
      delete document.body.dataset.menuOpen
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.dataset.menuOpen = 'true'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      delete document.body.dataset.menuOpen
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Fyther Store, inicio">
          <BrandMark decorative priority />
        </Link>

        <nav
          id="primary-navigation"
          className={`site-nav${open ? ' is-open' : ''}`}
          aria-label="Navegación principal"
        >
          <Link href="/#descubrir" onClick={() => setOpen(false)}>Descubrir</Link>
          <Link href="/catalogo" onClick={() => setOpen(false)}>Colección</Link>
          <Link href="/#fyther" onClick={() => setOpen(false)}>Nosotras</Link>
        </nav>

        <div className="header-actions">
          <Link
            href="/carrito"
            className="icon-link cart-link"
            aria-label={`Carrito, ${countLabel}`}
          >
            <ShoppingBag aria-hidden="true" size={20} strokeWidth={1.7} />
            <span>{count}</span>
          </Link>
          <button
            type="button"
            className="icon-button menu-button"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-controls="primary-navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
          </button>
        </div>
      </div>
    </header>
  )
}
