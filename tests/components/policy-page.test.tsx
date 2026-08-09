import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PolicyPage from '@/components/site/PolicyPage'

describe('PolicyPage', () => {
  it('renders one page heading, every section, and the current-version note', () => {
    render(<PolicyPage
      eyebrow="FYTHER / POLÍTICA"
      title="Envíos y apartados"
      intro="Todo lo importante, con claridad."
      sections={[
        { title: 'Envíos', content: <p>Entregas coordinadas.</p> },
        { title: 'Apartados', content: <p>Condiciones coordinadas.</p> },
      ]}
    />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Envíos y apartados' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Envíos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Apartados' })).toBeInTheDocument()
    expect(screen.getByText('Información vigente para esta versión de la tienda.')).toBeInTheDocument()
  })
})
