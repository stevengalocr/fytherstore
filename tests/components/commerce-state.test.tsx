import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommerceState from '@/components/commerce/CommerceState'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

describe('CommerceState', () => {
  beforeEach(() => refresh.mockClear())

  it('renders an editorial empty state without product inventory', () => {
    render(<CommerceState state="empty" />)

    expect(screen.getByRole('heading', { name: 'La colección vuelve pronto.' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /mujer con ropa activa/i })).toHaveAttribute('src', expect.stringContaining('modelo2'))
    expect(screen.getByRole('link', { name: /conocer fyther/i })).toHaveAttribute('href', '/#fyther')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('renders a customer-safe unconfigured state without fictional products or technical copy', () => {
    const { container } = render(<CommerceState state="unconfigured" />)

    expect(screen.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeInTheDocument()
    expect(container.querySelector('[data-variant="alternate"] img')).toHaveAttribute('src', expect.stringContaining('logo2'))
    expect(container.querySelector('[data-variant="alternate"] img')).toHaveAttribute('sizes', '260px')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent(/key|endpoint|supabase|bilbildin|demo|simulaci/i)
  })

  it('renders an alert and refreshes the route when retrying', async () => {
    const user = userEvent.setup()
    render(<CommerceState state="error" />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('No pudimos cargar la colección.')
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
