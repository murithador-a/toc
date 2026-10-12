import { useEffect, useState } from 'react'
import { WhatsApp } from '../ui/icons'
import { defaultWhatsAppUrl } from '../../lib/whatsapp'

/**
 * Mobile-first WhatsApp access. Appears only after the visitor has started
 * scrolling, stays small, and never covers navigation or form controls.
 */
export function WhatsAppFloat() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={defaultWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center border border-ivory/20 bg-charcoal text-ivory shadow-[0_10px_30px_rgba(36,39,36,0.28)] transition-all duration-500 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 lg:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      aria-label="Chat with TOC Luxury Constructions on WhatsApp"
    >
      <WhatsApp className="h-5 w-5" />
    </a>
  )
}
