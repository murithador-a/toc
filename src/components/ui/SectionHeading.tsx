import type { ReactNode } from 'react'

export function Eyebrow({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'light' }) {
  return (
    <p
      className={`flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow ${
        tone === 'dark' ? 'text-bronze' : 'text-bronze'
      }`}
    >
      <span aria-hidden="true" className="h-px w-8 bg-bronze" />
      {children}
    </p>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = 'dark',
  align = 'left',
  className = '',
  level = 2,
}: {
  eyebrow?: string
  title: ReactNode
  intro?: ReactNode
  tone?: 'dark' | 'light'
  align?: 'left' | 'center'
  className?: string
  level?: 1 | 2 | 3
}) {
  const Heading = (`h${level}` as unknown) as 'h1' | 'h2' | 'h3'
  return (
    <div className={`${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'} ${className}`}>
      {eyebrow ? (
        <div className={align === 'center' ? 'flex justify-center' : ''}>
          <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        </div>
      ) : null}
      <Heading
        className={`mt-6 font-display text-display-sm sm:text-display lg:text-display-lg ${
          tone === 'dark' ? 'text-charcoal' : 'text-ivory'
        }`}
      >
        {title}
      </Heading>
      {intro ? (
        <div
          className={`mt-6 space-y-4 font-sans text-[1.0625rem] leading-relaxed ${
            tone === 'dark' ? 'text-stone-600' : 'text-stone-300'
          }`}
        >
          {intro}
        </div>
      ) : null}
    </div>
  )
}
