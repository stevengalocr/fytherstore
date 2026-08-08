import Image from 'next/image'

export default function BrandMark({
  decorative = false,
  priority = false,
  variant = 'primary',
  sizes = '(max-width: 767px) 88px, 112px',
}: {
  decorative?: boolean
  priority?: boolean
  variant?: 'primary' | 'alternate'
  sizes?: string
}) {
  return (
    <span className="brand-mark" data-variant={variant}>
      <Image
        src={variant === 'primary' ? '/logo1.png' : '/logo2.png'}
        alt={decorative ? '' : 'Fyther Store'}
        width={220}
        height={220}
        priority={priority}
        sizes={sizes}
      />
    </span>
  )
}
