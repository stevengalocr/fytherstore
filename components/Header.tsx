'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { CommerceMode } from '@/lib/commerce/types'

export default function Header({ mode = 'demo' }: { mode?: CommerceMode }) {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const countLabel = `${count} ${count === 1 ? 'producto' : 'productos'}`

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Fyther Store, inicio">
          <span>FYTHER</span>
          <small>STORE</small>
        </Link>

        <nav className={`site-nav${open ? ' is-open' : ''}`} aria-label="Navegación principal">
          <Link href="/catalogo" onClick={() => setOpen(false)}>Colección</Link>
          <Link href="/#movimiento" onClick={() => setOpen(false)}>Movimiento</Link>
          <Link href="/#preguntas" onClick={() => setOpen(false)}>Preguntas</Link>
          {mode === 'demo' && <span className="demo-label">Modo demo</span>}
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
