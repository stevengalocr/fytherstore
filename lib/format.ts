// Formato de precios en colones (₡) — mismo formato del diseño original.
export function fmt(n: number): string {
  return '₡' + n.toLocaleString('de-DE')
}

// Fondos de placeholder neon (del diseño FYTHER) para productos sin foto.
const PLACEHOLDER_BGS = [
  'repeating-linear-gradient(135deg,#e8f6f5 0 14px,#f0faf9 14px 28px)',
  'repeating-linear-gradient(135deg,#efeef4 0 14px,#f6f5fa 14px 28px)',
  'repeating-linear-gradient(135deg,#fdeef5 0 14px,#fef5f9 14px 28px)',
  'repeating-linear-gradient(135deg,#eceff1 0 14px,#f4f6f7 14px 28px)',
]

// Placeholder determinístico por id para que cada producto conserve su patrón.
export function placeholderBg(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PLACEHOLDER_BGS[h % PLACEHOLDER_BGS.length]
}
