import type { ElementType, ReactNode } from 'react'

export function Container({
  as: Tag = 'div',
  className = '',
  children,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
}) {
  return <Tag className={`mx-auto w-full max-w-shell px-5 sm:px-8 lg:px-12 ${className}`}>{children}</Tag>
}
