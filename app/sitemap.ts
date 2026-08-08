import type { MetadataRoute } from 'next'

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
const baseUrl = configuredSiteUrl && URL.canParse(configuredSiteUrl) ? configuredSiteUrl : 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/catalogo', '/carrito', '/privacidad', '/terminos', '/envios-cambios'].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === '' || path === '/catalogo' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/catalogo' ? 0.9 : 0.5,
  }))
}
