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
  const image = variant === 'primary'
    ? { src: '/brand/fyther-mark-header.webp', width: 640, height: 640 }
    : { src: '/brand/fyther-mark-footer.webp', width: 960, height: 960 }

  return (
    <span className="brand-mark" data-variant={variant}>
      <Image
        src={image.src}
        alt={decorative ? '' : 'Fyther Store'}
        width={image.width}
        height={image.height}
        priority={priority}
        sizes={sizes}
      />
    </span>
  )
}
