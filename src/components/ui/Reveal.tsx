import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

/**
 * Gentle in-view reveal.
 *
 * Content is always present in the DOM and readable without JavaScript. The
 * hidden state is only armed by adding `.js-reveal-armed` to <html> when the
 * observer is available (see main.tsx), and a safety timer reveals everything
 * after a short delay so no content can ever remain permanently invisible — for
 * example if an observer callback is missed. Reduced-motion visitors see the
 * content immediately with no transition.
 */

/** Reveal unconditionally if the observer has not fired within this window. */
const SAFETY_TIMEOUT_MS = 8000

export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: ElementType
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (revealed) return
    const node = ref.current
    if (!node) return

    const reveal = () => setRevealed(true)

    if (typeof IntersectionObserver === 'undefined') {
      reveal()
      return
    }

    // Anything already in (or near) view at mount reveals immediately.
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight * 1.05 && rect.bottom > -1) {
      reveal()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal()
            observer.disconnect()
          }
        })
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    )
    observer.observe(node)

    const timer = window.setTimeout(reveal, SAFETY_TIMEOUT_MS)

    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [revealed])

  return (
    <Tag
      ref={ref}
      className={`reveal ${revealed ? 'is-revealed' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
