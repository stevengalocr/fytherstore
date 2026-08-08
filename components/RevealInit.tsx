'use client'

// Activa las animaciones de aparición [data-reveal] al hacer scroll.
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function RevealInit() {
  const pathname = usePathname()

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.setAttribute('data-reveal', 'on')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('[data-reveal]:not([data-reveal="on"])').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [pathname])

  return null
}
