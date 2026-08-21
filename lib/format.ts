import type { Money } from '@/lib/commerce/types'

const crc = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
})

export function formatMoney(money: Money): string {
  return crc.format(money.amount)
}
