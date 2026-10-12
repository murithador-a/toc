import { Link } from 'react-router-dom'
import { Monogram } from './Monogram'
import { useContent } from '../../content/context'

type Tone = 'dark' | 'light'

/**
 * TOC lockup: monogram + wordmark.
 * This is a proposed brand refresh — replace the file with approved artwork if
 * the company supplies official brand assets (see docs/BRAND-ASSETS.md).
 */
export function Wordmark({
  tone = 'dark',
  className = '',
  to = '/',
  compact = false,
}: {
  tone?: Tone
  className?: string
  to?: string
  compact?: boolean
}) {
  const { company } = useContent()
  const primary = tone === 'dark' ? 'text-charcoal' : 'text-ivory'
  const secondary = tone === 'dark' ? 'text-stone-500' : 'text-stone-300'

  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 ${className}`}
      style={{ ['--tw-ring-offset-color' as string]: tone === 'dark' ? '#F5F2EC' : '#242724' }}
      aria-label={`${company.legalName} — home`}
    >
      <Monogram
        tone={tone === 'dark' ? 'default' : 'white'}
        className={compact ? 'h-8 w-8 shrink-0' : 'h-10 w-10 shrink-0 sm:h-11 sm:w-11'}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display ${compact ? 'text-[1rem]' : 'text-[1.15rem] sm:text-[1.3rem]'} ${primary} tracking-[0.01em]`}
        >
          {company.monogram} Luxury
        </span>
        <span className={`mt-[0.3rem] font-sans text-[0.5rem] uppercase tracking-eyebrow ${secondary}`}>
          Constructions Ltd
        </span>
      </span>
    </Link>
  )
}
