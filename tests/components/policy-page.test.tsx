import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Link from 'next/link'
import { describe, expect, it } from 'vitest'
import PolicyPage from '@/components/site/PolicyPage'

describe('PolicyPage', () => {
  it('renders one page heading, every section, and the current-version note', () => {
    const { container } = render(<PolicyPage
      eyebrow="FYTHER / POLÍTICA"
      title="Envíos y apartados"
      intro="Todo lo importante, con claridad."
      sections={[
        { title: 'Envíos', content: <p>Entregas coordinadas.</p> },
        { title: 'Apartados', content: <p>Condiciones coordinadas. <Link href="/catalogo">Ver la colección</Link></p> },
      ]}
    />)

    expect(container.querySelector('article.policy-page')).toBe(container.firstElementChild)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Envíos y apartados' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Envíos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Apartados' })).toBeInTheDocument()
    expect(screen.getByText('Información vigente para esta versión de la tienda.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
    expect(container.querySelectorAll('.policy-sections > section')).toHaveLength(2)
    expect(container.querySelector('.policy-sections .status-surface, .policy-sections .order-summary, .policy-sections .commerce-summary-panel')).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent(/cambios|devoluciones/i)
  })

  it('keeps policy copy within a calm reading measure and links touch-safe on mobile', () => {
    const styles = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

    expect(styles).toMatch(/\.policy-page\s*\{[^}]*max-width:\s*68ch;/)
    expect(styles).toMatch(/\.policy-sections p\s*\{[^}]*max-width:\s*6[2-8]ch;/)
    expect(styles).toMatch(/\.policy-sections a\s*\{[^}]*min-height:\s*44px;/)
  })
})
