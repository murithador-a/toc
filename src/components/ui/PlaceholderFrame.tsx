import { Monogram } from '../brand/Monogram'

/**
 * Reserved space for photography the company has not supplied yet — the
 * sketch of a frame rather than a stock photograph pretending to be TOC work.
 */
export function PlaceholderFrame({
  label,
  caption,
  aspect = 'aspect-[4/3]',
  className = '',
}: {
  label: string
  caption?: string
  aspect?: string
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 border border-dashed border-bronze/45 bg-white/60 px-6 py-12 text-center ${aspect} ${className}`}
    >
      <Monogram className="h-9 w-9 opacity-70" />
      <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-bronze">{label}</p>
      {caption ? <p className="max-w-xs font-sans text-[0.8125rem] leading-relaxed text-stone-500">{caption}</p> : null}
    </div>
  )
}
