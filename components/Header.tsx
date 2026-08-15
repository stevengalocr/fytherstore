'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import BrandMark from '@/components/BrandMark'

export default function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const countLabel = `${count} ${count === 1 ? 'producto' : 'productos'}`

  useEffect(() => {
    let frameId: number | null = null

    const updateScrolledState = () => {
      frameId = null
      setScrolled(window.scrollY > 40)
    }
    const queueScrolledState = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateScrolledState)
      }
    }

    setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', queueScrolledState, { passive: true })

    return () => {
      window.removeEventListener('scroll', queueScrolledState)
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      delete document.body.dataset.menuOpen
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    const desktopMedia = window.matchMedia('(min-width: 769px)')
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false)
    }

    document.body.dataset.menuOpen = 'true'
    window.addEventListener('keydown', closeOnEscape)
    desktopMedia.addEventListener('change', closeOnDesktop)

    return () => {
      delete document.body.dataset.menuOpen
      window.removeEventListener('keydown', closeOnEscape)
      desktopMedia.removeEventListener('change', closeOnDesktop)
    }
  }, [open])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Fyther Store, inicio">
          <BrandMark decorative priority />
        </Link>

        <button
          ref={menuButtonRef}
          type="button"
          className="icon-button menu-button"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-controls="primary-navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
        </button>

        <nav
          id="primary-navigation"
          className={`site-nav${open ? ' is-open' : ''}`}
          aria-label="Navegación principal"
        >
          <Link href="/catalogo?categoria=Ropa" onClick={() => setOpen(false)}>Ropa</Link>
          <Link href="/catalogo?categoria=Accesorios" onClick={() => setOpen(false)}>Accesorios</Link>
          <Link href="/envios-apartados" onClick={() => setOpen(false)}>Seguir pedido</Link>
        </nav>

        <Link
          href="/carrito"
          className="icon-link cart-link"
          aria-label={`Carrito, ${countLabel}`}
        >
          <ShoppingBag aria-hidden="true" size={20} strokeWidth={1.7} />
          <span>{count}</span>
        </Link>
      </div>
    </header>
  )
}
