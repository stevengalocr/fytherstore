import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Footer from '@/components/Footer'
import sitemap from '@/app/sitemap'
import ShippingPolicyPage, { metadata } from '@/app/envios-apartados/page'

const permanentRedirect = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ permanentRedirect }))

import LegacyShippingPage from '@/app/envios-cambios/page'

describe('shipping and layaway policy', () => {
  it('publishes the required metadata and factual policy content', () => {
    const { container } = render(<ShippingPolicyPage />)
    const article = container.querySelector('article') as HTMLElement

    expect(metadata).toEqual({ title: 'Envíos y apartados' })
    expect(within(article).getByText('FYTHER / SERVICIO')).toBeInTheDocument()
    expect(within(article).getByRole('heading', { level: 1, name: 'Envíos y apartados, con claridad.' })).toBeInTheDocument()
    expect(article).toHaveTextContent(/cobertura.*costo.*condiciones.*cada pedido/i)
    expect(within(article).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Correos de Costa Rica',
      'Apartados',
      'Seguimiento',
      'Ayuda',
    ])
    expect(article).toHaveTextContent(/envío.*Correos de Costa Rica/i)
    expect(article).toHaveTextContent(/cobertura.*costo.*coordina.*cada pedido/i)
    expect(article).toHaveTextContent(/apartados.*disponibles/i)
    expect(article).toHaveTextContent(/condiciones.*acuerdan.*antes.*reserva/i)
    expect(article).toHaveTextContent(/pedido confirmado.*vista única.*seguimiento.*BilBildin/i)
    expect(within(article).getByRole('link', { name: 'fytherstore@gmail.com' })).toHaveAttribute('href', 'mailto:fytherstore@gmail.com')
    expect(article).toHaveTextContent(/menos de 24 horas/i)
    expect(article).not.toHaveTextContent(/cambios|devoluciones/i)
    expect(article).not.toHaveTextContent(/\b\d+\s*(días?|semanas?|%)\b/i)
  })

  it('redirects the legacy service route permanently', () => {
    LegacyShippingPage()

    expect(permanentRedirect).toHaveBeenCalledOnce()
    expect(permanentRedirect).toHaveBeenCalledWith('/envios-apartados')
  })

  it('links the footer and sitemap only to the current service route', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: 'Envíos y apartados' })).toHaveAttribute('href', '/envios-apartados')
    expect(screen.queryByRole('link', { name: /envíos y cambios/i })).not.toBeInTheDocument()
    const paths = sitemap().map(({ url }) => new URL(url).pathname)
    expect(paths).toContain('/envios-apartados')
    expect(paths).not.toContain('/envios-cambios')
  })
})
