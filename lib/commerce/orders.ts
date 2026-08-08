export function buildOrderFilters(orderId: string, businessId: string) {
  if (!orderId || !businessId) throw new Error('Pedido y negocio son obligatorios.')
  return { id: orderId, business_id: businessId }
}
