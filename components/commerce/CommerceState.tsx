import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

type State = 'empty' | 'error' | 'unconfigured'

export default function CommerceState({ state }: { state: State }) {
  if (state === 'unconfigured') {
    return (
      <section className="commerce-empty">
        <p className="section-label">FYTHER / ACTIVE STORE</p>
        <h2 className="display">Collection incoming.</h2>
        <p>El catálogo se conecta desde BilBildin. La selección aparecerá aquí cuando la tienda esté configurada.</p>
        <a className="button button-ghost" href="mailto:stevengalocr@gmail.com">Contactar</a>
      </section>
    )
  }

  if (state === 'error') {
    return (
      <section className="commerce-empty" role="alert">
        <AlertCircle aria-hidden="true" size={28} strokeWidth={1.6} />
        <h2 className="display">El movimiento sigue.</h2>
        <p>No pudimos cargar esta selección. Intenta de nuevo o vuelve al inicio.</p>
        <Link className="button button-ghost" href="/">Volver al inicio</Link>
      </section>
    )
  }

  return (
    <section className="commerce-empty">
      <p className="section-label">FYTHER / ACTIVE STORE</p>
      <h2 className="display">First drop in motion.</h2>
      <p>La primera selección se está preparando.</p>
      <a className="button button-ghost" href="mailto:stevengalocr@gmail.com">Contactar</a>
    </section>
  )
}
