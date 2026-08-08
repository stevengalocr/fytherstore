'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="commerce-empty container">
      <p className="section-label">FYTHER / ERROR</p>
      <h2 className="display">Algo perdió el ritmo.</h2>
      <p>No pudimos cargar esta vista. Tus productos del carrito siguen guardados en este navegador.</p>
      <button type="button" className="button button-accent" onClick={reset}>Intentar de nuevo</button>
    </div>
  )
}
