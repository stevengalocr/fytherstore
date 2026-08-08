import type { MetadataRoute } from 'next'

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
const baseUrl = configuredSiteUrl && URL.canParse(configuredSiteUrl) ? configuredSiteUrl : 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/checkout', '/confirmacion/', '/tracking/'] },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
