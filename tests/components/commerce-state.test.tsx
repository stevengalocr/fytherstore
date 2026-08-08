import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CommerceState from '@/components/commerce/CommerceState'

describe('CommerceState', () => {
  it('renders an honest live empty state without product articles', () => {
    render(<CommerceState mode="live" state="empty" />)
    expect(screen.getByText(/First drop in motion/i)).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('identifies the demo catalog clearly', () => {
    render(<CommerceState mode="demo" state="demo" />)
    expect(screen.getByText(/productos de demostración/i)).toBeInTheDocument()
  })
})
