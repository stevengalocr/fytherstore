import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ErrorPage from '@/app/error'
import NotFound from '@/app/not-found'

describe('recovery pages', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('offers a safe retry without rendering internal error details', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<ErrorPage error={new Error('private integration detail')} reset={reset} />)

    expect(screen.getByRole('heading', { name: 'No pudimos abrir esta vista.', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText(/private integration detail/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('returns missing routes to the collection', () => {
    render(<NotFound />)

    expect(screen.getByRole('heading', { name: 'No encontramos esta página.', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
  })
})
