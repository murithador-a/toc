import { useEffect } from 'react'
import { useAdmin } from '../AdminProvider'

/**
 * Sends any pending save before opening the live page in a new tab, so the
 * preview reflects what was just typed rather than the previous save.
 */
export function SectionPreviewLink({ to, label }: { to: string; label: string }) {
  const { flush, overall } = useAdmin()

  useEffect(() => {
    if (overall === 'idle' || overall === 'saved') return
    const handler = () => {
      void flush()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [flush, overall])

  return (
    <a
      href={to}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        void flush()
      }}
      className="border border-charcoal/20 px-3 py-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-charcoal"
    >
      Preview {label}
    </a>
  )
}
