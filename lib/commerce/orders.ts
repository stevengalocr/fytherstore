export function buildOrderFilters(orderId: string, businessId: string) {
  if (!orderId || !businessId) throw new Error('Pedido y negocio son obligatorios.')
  return { id: orderId, business_id: businessId }
}

export function isDemoOrderId(orderId: string): boolean {
  return /^demo-[a-z0-9]+-[a-z0-9]+$/i.test(orderId)
}
