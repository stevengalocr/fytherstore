import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fyther Store',
    short_name: 'Fyther',
    description: 'Ropa y accesorios deportivos originales para moverte a tu manera.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050608',
    theme_color: '#050608',
    lang: 'es-CR',
    icons: [
      { src: '/icons/fyther-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/fyther-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/fyther-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
