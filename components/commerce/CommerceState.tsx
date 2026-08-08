import Link from 'next/link'
import { AlertCircle, FlaskConical } from 'lucide-react'
import type { CommerceMode } from '@/lib/commerce/types'

type State = 'empty' | 'error' | 'demo'

export default function CommerceState({ mode, state }: { mode: CommerceMode; state: State }) {
  if (state === 'demo') {
    return (
      <aside className="commerce-notice" aria-label="Información del modo demo">
        <FlaskConical aria-hidden="true" size={19} strokeWidth={1.7} />
        <p><strong>Productos de demostración.</strong> Puedes recorrer toda la compra. No se realizará ningún cobro.</p>
      </aside>
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
      <p>{mode === 'live' ? 'La primera selección se está preparando.' : 'La demostración no tiene productos disponibles.'}</p>
      <a className="button button-ghost" href="mailto:stevengalocr@gmail.com">Contactar</a>
    </section>
  )
}
