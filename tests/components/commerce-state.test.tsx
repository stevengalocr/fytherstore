import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CommerceState from '@/components/commerce/CommerceState'

describe('CommerceState', () => {
  it('renders an honest live empty state without product articles', () => {
    render(<CommerceState state="empty" />)
    expect(screen.getByText(/First drop in motion/i)).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('renders an unconfigured state without fictional products', () => {
    render(<CommerceState state="unconfigured" />)
    expect(screen.getByText(/catálogo se conecta desde bilbildin/i)).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.queryByText(/demo|simulaci/i)).not.toBeInTheDocument()
  })
})
