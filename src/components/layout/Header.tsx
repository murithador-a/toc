import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Wordmark } from '../brand/Wordmark'
import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Close, Menu, Phone, WhatsApp } from '../ui/icons'
import { useContent } from '../../content/context'
import { defaultWhatsAppUrl } from '../../lib/whatsapp'

export function Header() {
  const { menu, company } = useContent()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Body scroll lock + Escape to close + focus handling for the mobile panel
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('a,button')?.focus()
    })
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
      if (previous && document.contains(previous)) previous.focus()
      else toggleRef.current?.focus()
    }
  }, [open])

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-500 ease-editorial ${
        scrolled ? 'border-b border-charcoal/10 bg-ivory/95 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <Container className={`flex items-center justify-between gap-6 transition-all duration-500 ${scrolled ? 'py-3' : 'py-5'}`}>
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {menu.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative font-sans text-[0.8125rem] font-medium tracking-[0.02em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-ivory ${
                  isActive ? 'text-charcoal' : 'text-stone-600 hover:text-charcoal'
                }`
              }
            >
              {({ isActive }) => (
                <span className="relative pb-1">
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-px bg-bronze transition-transform duration-300 ease-editorial ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={`tel:${company.phone.tel}`}
            className="inline-flex items-center gap-2 font-sans text-[0.8125rem] font-medium text-stone-600 transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
          >
            <Phone className="h-4 w-4" />
            {company.phone.display}
          </a>
          <a
            href={defaultWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-sans text-[0.8125rem] font-medium text-stone-600 transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
          >
            <WhatsApp className="h-4 w-4" />
            WhatsApp
          </a>
          <ButtonLink to="/contact#inquiry" variant="primary">
            Request a Quote
          </ButtonLink>
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="inline-flex h-11 w-11 items-center justify-center border border-charcoal/15 text-charcoal transition-colors hover:border-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-ivory lg:hidden"
        >
          {open ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {/* Mobile navigation panel */}
      {open ? (
        <div
          id="mobile-nav"
          ref={panelRef}
          className="fixed inset-0 z-40 overflow-y-auto bg-ivory px-5 pb-14 pt-28 sm:px-8 lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {menu.map((item, index) => (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-baseline justify-between border-b border-charcoal/10 py-5 font-display text-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 ${
                    isActive ? 'text-bronze' : 'text-charcoal'
                  }`
                }
              >
                {item.label}
                <span aria-hidden="true" className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-400">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            <ButtonLink to="/contact#inquiry" variant="primary" size="lg" className="w-full">
              Request a Quote
            </ButtonLink>
            <ButtonLink to="/consultation" variant="outline" size="lg" className="w-full">
              Request a Consultation
            </ButtonLink>
          </div>

          <div className="mt-10 space-y-4 border-t border-charcoal/10 pt-6 font-sans text-[0.875rem]">
            <a
              href={`tel:${company.phone.tel}`}
              className="flex items-center gap-3 text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
            >
              <Phone className="h-4 w-4 text-bronze" />
              {company.phone.display}
            </a>
            <a
              href={defaultWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
            >
              <WhatsApp className="h-4 w-4 text-bronze" />
              Message us on WhatsApp
            </a>
            <p className="leading-relaxed text-stone-500">{company.addressFull}</p>
            <Link
              to="/privacy"
              onClick={() => setOpen(false)}
              className="inline-block text-stone-500 underline-offset-4 hover:text-charcoal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
            >
              Privacy policy
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
