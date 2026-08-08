'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import OrderPresentation from '@/components/commerce/OrderPresentation'
import type { CommerceOrder } from '@/lib/commerce/types'

export default function DemoOrderView({ orderId, view }: { orderId: string; view: 'confirmation' | 'tracking' }) {
  const [order, setOrder] = useState<CommerceOrder | null | undefined>(undefined)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`fyther-demo-order:${orderId}`)
      setOrder(raw ? JSON.parse(raw) as CommerceOrder : null)
    } catch { setOrder(null) }
  }, [orderId])

  if (order === undefined) return <div className="order-loading container" aria-live="polite">Cargando pedido...</div>
  if (!order) return <div className="commerce-empty"><h1 className="display">Pedido no encontrado.</h1><p>La demostración solo está disponible en el navegador donde se creó.</p><Link className="button" href="/catalogo">Volver a la colección</Link></div>
  return <OrderPresentation order={order} view={view} />
}
