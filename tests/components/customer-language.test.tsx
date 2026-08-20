import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TermsPage from '@/app/terminos/page'
import PrivacyPage from '@/app/privacidad/page'
import ShippingPage from '@/app/envios-apartados/page'

const internalLanguage = /bilbildin|modo live|configuraci[oó]n|configurad[oa]s?/i

describe('customer-facing policy language', () => {
  it.each([
    ['terms', TermsPage],
    ['privacy', PrivacyPage],
    ['shipping', ShippingPage],
  ])('keeps %s free of platform and deployment terminology', (_label, Page) => {
    const { container } = render(<Page />)

    expect(container).not.toHaveTextContent(internalLanguage)
    expect(container).not.toHaveTextContent(/cambios|devoluciones/i)
  })
})
