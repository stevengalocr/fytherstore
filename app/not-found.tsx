import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="recovery-page status-surface container">
      <p className="section-label">FYTHER / 404</p>
      <h1 className="display">No encontramos esta página.</h1>
      <p>El enlace puede haber cambiado o ya no estar disponible.</p>
      <Link href="/catalogo" className="button button-primary status-primary-action">Ver la colección</Link>
    </div>
  )
}
