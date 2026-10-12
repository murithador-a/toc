import { Star } from './icons'

/** Renders a rating value with a partial-fill star row (decorative). */
export function RatingStars({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, value - index))
        return (
          <span key={index} className="relative inline-block h-[1.05rem] w-[1.05rem]">
            <Star className="absolute inset-0 h-full w-full text-stone-300" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-full w-[1.05rem] text-bronze" />
            </span>
          </span>
        )
      })}
    </div>
  )
}

/** Accessible text equivalent of the rating row. */
export function RatingText({
  value,
  max,
  count,
  className = '',
}: {
  value: number
  max: number
  count: number
  className?: string
}) {
  return (
    <span className={className}>
      {value} out of {max}, based on {count} Google reviews
    </span>
  )
}
