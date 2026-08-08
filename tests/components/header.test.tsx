import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Header from '@/components/Header'

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ count: 2 }),
}))

describe('Header', () => {
  it('exposes primary navigation and a labeled mobile menu control', () => {
    render(<Header mode="demo" />)
    expect(screen.getByRole('navigation', { name: /principal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /menú/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /carrito, 2 productos/i })).toBeInTheDocument()
  })
})
