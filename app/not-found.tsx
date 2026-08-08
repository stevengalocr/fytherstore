import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="recovery-page container">
      <p className="section-label">FYTHER / 404</p>
      <h2 className="display">No encontramos esta página.</h2>
      <p>El enlace puede haber cambiado o ya no estar disponible.</p>
      <Link href="/catalogo" className="button button-primary">Ver la colección</Link>
    </div>
  )
}
