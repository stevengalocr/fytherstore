import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RetryCommerceButton from '@/components/commerce/RetryCommerceButton'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

describe('RetryCommerceButton', () => {
  beforeEach(() => refresh.mockClear())

  it('refreshes the current route when selected', async () => {
    const user = userEvent.setup()
    render(<RetryCommerceButton />)

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps navigation hooks isolated from the server-compatible commerce state', () => {
    const commerceStateSource = readFileSync(resolve(process.cwd(), 'components/commerce/CommerceState.tsx'), 'utf8')
    const retrySource = readFileSync(resolve(process.cwd(), 'components/commerce/RetryCommerceButton.tsx'), 'utf8')

    expect(commerceStateSource).not.toMatch(/^['"]use client['"]/)
    expect(commerceStateSource).not.toContain('next/navigation')
    expect(retrySource).toMatch(/^'use client'/)
  })
})
