'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RetryCommerceButton() {
  const router = useRouter()

  return (
    <button className="button" type="button" onClick={() => router.refresh()}>
      <RefreshCw aria-hidden="true" size={17} /> Intentar de nuevo
    </button>
  )
}
