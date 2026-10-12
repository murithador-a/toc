import type { ContentImage } from '../../content/types'

type Props = {
  /** A content image object — src/srcset/alt/focal all come from content/site.json */
  image: ContentImage
  /** Responsive sizes attribute — be specific, it saves real bytes */
  sizes?: string
  className?: string
  imgClassName?: string
  /** Hero / above-the-fold images load eagerly */
  priority?: boolean
  /** Tailwind aspect utility controlling the crop, e.g. "aspect-[4/3]" */
  ratio?: string
  /** Set when the surrounding layout already handles cropping */
  bare?: boolean
}

/**
 * Responsive image driven entirely by content.
 *
 * Intrinsic width/height are written whenever known so the browser reserves the
 * right space before the file arrives (no layout shift); when an upload has no
 * recorded dimensions the aspect-ratio wrapper does that job instead.
 */
export function Picture({
  image,
  sizes = '100vw',
  className = '',
  imgClassName = '',
  priority = false,
  ratio = 'aspect-[4/3]',
  bare = false,
}: Props) {
  const element = (
    <img
      src={image.src}
      srcSet={image.srcset || undefined}
      sizes={image.srcset ? sizes : undefined}
      width={image.width || undefined}
      height={image.height || undefined}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      style={image.focal ? { objectPosition: image.focal } : undefined}
      className={`h-full w-full object-cover ${imgClassName}`}
    />
  )

  if (bare) return element

  return <div className={`relative overflow-hidden bg-stone-100 ${ratio} ${className}`}>{element}</div>
}
