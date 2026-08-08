import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PolicyPage from '@/components/site/PolicyPage'

describe('PolicyPage', () => {
  it('renders one page heading, every section, and the current-version note', () => {
    render(<PolicyPage
      eyebrow="FYTHER / POLÍTICA"
      title="Envíos y cambios"
      intro="Todo lo importante, con claridad."
      sections={[
        { title: 'Envíos', content: <p>Entregas coordinadas.</p> },
        { title: 'Cambios', content: <p>Escríbenos para acompañarte.</p> },
      ]}
    />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Envíos y cambios' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Envíos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Cambios' })).toBeInTheDocument()
    expect(screen.getByText('Información vigente para esta versión de la tienda.')).toBeInTheDocument()
  })
})
