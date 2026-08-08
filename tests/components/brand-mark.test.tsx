import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BrandMark from '@/components/BrandMark'

describe('BrandMark', () => {
  it('renders the official primary logo without recreated brand text', () => {
    render(<BrandMark />)

    expect(screen.getByRole('img', { name: 'Fyther Store' })).toHaveAttribute(
      'src',
      expect.stringContaining('logo1.png'),
    )
    expect(screen.queryByText('FYTHER', { exact: true })).not.toBeInTheDocument()
  })

  it('renders with empty alt text when decorative', () => {
    const { container } = render(<BrandMark decorative />)

    expect(container.querySelector('img')).toHaveAttribute('alt', '')
  })
})
