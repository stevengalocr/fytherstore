import type { Metadata } from 'next'
import { Archivo, Manrope } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { commerceMode } from '@/lib/commerce'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
const siteUrl = configuredSiteUrl && URL.canParse(configuredSiteUrl) ? configuredSiteUrl : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Fyther Store | Move Different', template: '%s | Fyther Store' },
  description: 'Ropa y artículos deportivos seleccionados para moverte con confianza.',
  openGraph: {
    title: 'Fyther Store | Move Different',
    description: 'Ropa y artículos deportivos seleccionados para moverte con confianza.',
    locale: 'es_CR',
    type: 'website',
    images: [{ url: '/home.jpeg', width: 1024, height: 572, alt: 'Fyther Store' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${manrope.variable}`}>
      <body>
        <span
          hidden
          dangerouslySetInnerHTML={{ __html: '<!-- FYTHER-DIRECTION: high-performance editorial magazine; Bone, Obsidian and Volt; story leads from movement to a precise purchase; first viewport pairs manifesto type with campaign media; finish requires review and DESIGN.md. -->' }}
        />
        <CartProvider>
          <div className="page-shell">
            <Header mode={commerceMode} />
            <main>{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
