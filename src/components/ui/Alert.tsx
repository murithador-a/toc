import type { ReactNode } from 'react'
import { AlertTriangle, Check, Info } from './icons'

type Variant = 'info' | 'success' | 'error'

const styles: Record<Variant, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'border-stone-300 bg-white text-stone-600',
    icon: <Info className="h-4 w-4 text-bronze" />,
  },
  success: {
    wrapper: 'border-bronze/50 bg-white text-charcoal',
    icon: <Check className="h-4 w-4 text-bronze" />,
  },
  error: {
    wrapper: 'border-[#9c3b2e]/40 bg-[#FBF3F0] text-[#7a2f24]',
    icon: <AlertTriangle className="h-4 w-4 text-[#9c3b2e]" />,
  },
}

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
}: {
  variant?: Variant
  title?: string
  children?: ReactNode
  className?: string
}) {
  const { wrapper, icon } = styles[variant]
  return (
    <div
      className={`flex gap-3 border px-4 py-3.5 font-sans text-[0.875rem] leading-relaxed ${wrapper} ${className}`}
      role={variant === 'error' ? 'alert' : undefined}
    >
      <span className="mt-[0.15rem] shrink-0">{icon}</span>
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
      </div>
    </div>
  )
}
