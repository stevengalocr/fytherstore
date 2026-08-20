import type { NextConfig } from 'next'

type ImageEnv = Record<string, string | undefined> & {
  NEXT_PUBLIC_SUPABASE_URL?: string
}

type RemoteImagePattern = {
  protocol: 'https'
  hostname: string
  pathname: string
}

const HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i

export function resolveRemoteImagePatterns(env: ImageEnv): RemoteImagePattern[] {
  const configuredUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!configuredUrl || !URL.canParse(configuredUrl)) return []

  const url = new URL(configuredUrl)
  if (url.protocol !== 'https:'
    || !HOSTNAME.test(url.hostname)
    || url.username
    || url.password
    || url.port
    || url.pathname !== '/'
    || url.search
    || url.hash) {
    return []
  }

  return [{
    protocol: 'https',
    hostname: url.hostname.toLowerCase(),
    pathname: '/storage/v1/object/**',
  }]
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: resolveRemoteImagePatterns(process.env),
  },
  outputFileTracingRoot: process.cwd(),
}

export default nextConfig
