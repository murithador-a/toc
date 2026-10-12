import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'outline' | 'quiet' | 'inverse' | 'whatsapp' | 'link'
type Size = 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-charcoal text-ivory hover:bg-[#141613] focus-visible:ring-offset-ivory',
  outline:
    'border border-charcoal/25 text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory',
  quiet: 'border border-ivory/35 text-ivory hover:border-ivory hover:bg-ivory hover:text-charcoal',
  inverse: 'bg-ivory text-charcoal hover:bg-white focus-visible:ring-offset-charcoal',
  whatsapp: 'bg-charcoal text-ivory hover:bg-[#141613]',
  link: 'text-charcoal underline-offset-4 hover:text-bronze',
}

const sizes: Record<Size, string> = {
  md: 'px-6 py-3.5 text-[0.6875rem]',
  lg: 'px-7 py-4 text-[0.75rem]',
}

type CommonProps = {
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
  icon?: ReactNode
}

const classesFor = ({ variant = 'primary', size = 'md', className = '' }: CommonProps) =>
  [
    'group inline-flex max-w-full items-center justify-center gap-2.5 text-center font-sans font-semibold uppercase tracking-eyebrow',
    'transition-[background-color,color,border-color,transform] duration-300 ease-editorial',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-55',
    variant === 'link' ? '' : sizes[size],
    variants[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')

export function Button({
  children,
  variant,
  size,
  className,
  icon,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classesFor({ children, variant, size, className })} {...rest}>
      {children}
      {icon}
    </button>
  )
}

export function ButtonLink({
  children,
  to,
  variant,
  size,
  className,
  icon,
  external = false,
  ariaLabel,
}: CommonProps & { to: string; external?: boolean; ariaLabel?: string }) {
  const classes = classesFor({ children, variant, size, className })
  if (external) {
    return (
      <a href={to} className={classes} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        {children}
        {icon}
      </a>
    )
  }
  return (
    <Link to={to} className={classes} aria-label={ariaLabel}>
      {children}
      {icon}
    </Link>
  )
}

/** Anchor for in-page navigation (hero scroll targets, section links). */
export function ButtonAnchor({
  children,
  href,
  variant,
  size,
  className,
  icon,
  onClick,
}: CommonProps & { href: string; onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <a href={href} onClick={onClick} className={classesFor({ children, variant, size, className })}>
      {children}
      {icon}
    </a>
  )
}
