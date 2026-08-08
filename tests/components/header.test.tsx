import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Header from '@/components/Header'

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ count: 2 }),
}))

describe('Header', () => {
  it('renders the official mark and primary store navigation', () => {
    render(<Header />)

    const homeLink = screen.getByRole('link', { name: 'Fyther Store, inicio' })

    expect(homeLink.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.getByRole('navigation', { name: /principal/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Colección' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nosotras' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /carrito, 2 productos/i })).toBeInTheDocument()
    expect(screen.queryByText(/modo demo/i)).not.toBeInTheDocument()
  })

  it('opens and closes the mobile menu', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const menuButton = screen.getByRole('button', { name: 'Abrir menú' })

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(menuButton)

    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await user.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
