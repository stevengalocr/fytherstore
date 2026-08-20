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
    const { container } = render(<CommerceState state="empty" />)

    expect(container.querySelector('.status-surface')).toBe(container.firstElementChild)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'La colección vuelve pronto.' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /mujer con ropa activa/i })).toHaveAttribute('src', expect.stringContaining('modelo2'))
    const primaryAction = screen.getByRole('link', { name: /conocer fyther/i })
    expect(primaryAction).toHaveClass('status-primary-action')
    expect(primaryAction).toHaveAttribute('href', '/#fyther')
    expect(container.querySelectorAll('.status-primary-action')).toHaveLength(1)
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('renders a customer-safe unconfigured state without fictional products or technical copy', () => {
    const { container } = render(<CommerceState state="unconfigured" />)

    expect(container.querySelector('.status-surface')).toBe(container.firstElementChild)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Estamos preparando la colección.' })).toBeInTheDocument()
    expect(
      decodeURIComponent(
        container.querySelector('[data-variant="alternate"] img')?.getAttribute('src') ?? '',
      ),
    ).toContain('/brand/fyther-mark-footer.webp')
    expect(container.querySelector('[data-variant="alternate"] img')).toHaveAttribute('sizes', '260px')
    expect(screen.getByRole('link', { name: /conocer fyther/i })).toHaveClass('status-primary-action')
    expect(container.querySelectorAll('.status-primary-action')).toHaveLength(1)
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent(/key|clave|endpoint|environment|entorno|configuraci[oó]n|supabase|bilbildin|service.role|stack|digest|demo|simulaci[oó]n|cambios|devoluciones/i)
  })

  it('renders an alert and refreshes the route when retrying', async () => {
    const user = userEvent.setup()
    const { container } = render(<CommerceState state="error" />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('status-surface')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(alert).toHaveTextContent('No pudimos cargar la colección.')
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
    expect(container.querySelectorAll('.status-primary-action')).toHaveLength(1)
    expect(container.querySelector('.status-primary-action')).toContainElement(screen.getByRole('button', { name: 'Intentar de nuevo' }))
    expect(container).not.toHaveTextContent(/key|clave|endpoint|environment|entorno|configuraci[oó]n|supabase|bilbildin|service.role|stack|digest|demo|simulaci[oó]n|cambios|devoluciones/i)

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
