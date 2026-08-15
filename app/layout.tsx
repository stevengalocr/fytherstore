import type { Metadata } from 'next'
import { Barlow_Semi_Condensed, Manrope } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RevealInit from '@/components/RevealInit'
import './globals.css'

const display = Barlow_Semi_Condensed({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'], display: 'swap' })
const body = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
const siteUrl = configuredSiteUrl && URL.canParse(configuredSiteUrl) ? configuredSiteUrl : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Fyther Store | Muévete a tu manera', template: '%s | Fyther Store' },
  description: 'Accesorios originales y nuevas selecciones en camino para acompañar tu movimiento.',
  openGraph: {
    title: 'Fyther Store | Muévete a tu manera',
    description: 'Accesorios originales y nuevas selecciones en camino para acompañar tu movimiento.',
    locale: 'es_CR',
    type: 'website',
    images: [{ url: '/editorial/hero-poster-desktop.webp', width: 2400, height: 1350, alt: 'Fyther Store, movimiento y ropa deportiva femenina' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <span
          hidden
          dangerouslySetInnerHTML={{ __html: '<!-- FYTHER-DIRECTION: V0.2 Neon Door; warm nocturnal sports boutique; Cyan and Pink guide movement across Night surfaces; official brand assets and honest commerce lead every route. -->' }}
        />
        <CartProvider>
          <RevealInit />
          <div className="page-shell">
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
