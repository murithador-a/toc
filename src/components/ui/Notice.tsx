import type { ReactNode } from 'react'
import { Info } from './icons'

/**
 * Editorial note used for content-integrity disclosures: placeholder content,
 * temporary imagery, and anything still awaiting company confirmation.
 * Deliberately quiet — it informs, it does not shout.
 */
export function Notice({
  children,
  className = '',
  tone = 'light',
  label,
}: {
  children: ReactNode
  className?: string
  tone?: 'light' | 'dark'
  label?: string
}) {
  const dark = tone === 'dark'
  return (
    <div
      className={`flex gap-3 border-l-2 border-bronze py-1 pl-4 font-sans text-[0.8125rem] leading-relaxed ${
        dark ? 'text-stone-300' : 'text-stone-600'
      } ${className}`}
    >
      <Info className="mt-[0.2rem] h-4 w-4 shrink-0 text-bronze" />
      <p>
        {label ? <span className="font-semibold text-bronze">{label} </span> : null}
        {children}
      </p>
    </div>
  )
}
