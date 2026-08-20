'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function RevealInit() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const root = document.documentElement
    const reveals = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="on"])')]
    const currents = [...document.querySelectorAll<HTMLElement>('[data-current]')]
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    if (reduced || typeof IntersectionObserver === 'undefined') {
      reveals.forEach((element) => element.setAttribute('data-reveal', 'on'))
      currents.forEach((element) => element.style.setProperty('--current-progress', '1'))
      return
    }

    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-reveal', 'on')
        observer.unobserve(entry.target)
      }
    }), { threshold: 0.12 })
    reveals.forEach((element) => observer.observe(element))
    root.setAttribute('data-reveal-enhanced', 'true')

    let frame = 0
    const updateCurrent = () => {
      frame = 0
      currents.forEach((element) => {
        const rect = element.getBoundingClientRect()
        const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)))
        element.style.setProperty('--current-progress', progress.toFixed(3))
      })
    }
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateCurrent)
    }

    updateCurrent()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      root.removeAttribute('data-reveal-enhanced')
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [pathname])

  return null
}
