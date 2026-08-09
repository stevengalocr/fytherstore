'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="recovery-page container">
      <p className="section-label">FYTHER</p>
      <h1 className="display">No pudimos abrir esta vista.</h1>
      <p>Tu selección sigue guardada en este navegador.</p>
      <button type="button" className="button button-primary" onClick={reset}>Intentar de nuevo</button>
    </div>
  )
}
