import type { CSSProperties } from 'react'

type Tone = 'default' | 'white' | 'charcoal' | 'inverse'

const tones: Record<Tone, { frame: string; ink: string; background?: string }> = {
  default: { frame: '#A78B64', ink: '#242724' },
  charcoal: { frame: '#A78B64', ink: '#242724' },
  white: { frame: '#A78B64', ink: '#FFFFFF' },
  inverse: { frame: '#A78B64', ink: '#F5F2EC', background: '#242724' },
}

/**
 * Proposed TOC monogram — drawn as geometric paths rather than typeset text so
 * it renders identically everywhere (favicon, app icon, print, no webfont
 * required) and stays legible at very small sizes.
 */
export function Monogram({
  className,
  tone = 'default',
  style,
}: {
  className?: string
  tone?: Tone
  style?: CSSProperties
}) {
  const { frame, ink, background } = tones[tone]
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      role="img"
      aria-label="TOC Luxury Constructions Ltd monogram"
    >
      {background ? <rect x="0" y="0" width="64" height="64" fill={background} /> : null}
      <rect x="3.4" y="3.4" width="57.2" height="57.2" fill="none" stroke={frame} strokeWidth="1.1" />
      <g fill="none" stroke={ink} strokeWidth="3">
        <path d="M13 25h10M18 25v14" />
        <rect x="26.6" y="25" width="10" height="14" rx="0.9" />
        <path d="M51 25H41.6V39H51" />
      </g>
    </svg>
  )
}
