import { Link } from 'react-router-dom'
import { Wordmark } from '../brand/Wordmark'
import { Container } from '../ui/Container'
import { Compass, MapPin, Phone, WhatsApp } from '../ui/icons'
import { useContent } from '../../content/context'
import { defaultWhatsAppUrl } from '../../lib/whatsapp'

export function Footer() {
  const { company, footer, menu, services } = useContent()
  const year = new Date().getFullYear()

  const extraLinks = [
    { label: 'Request a Consultation', to: '/consultation' },
    { label: 'Privacy policy', to: '/privacy' },
  ]

  return (
    <footer className="border-t border-charcoal/10 bg-charcoal text-stone-300">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Wordmark tone="light" />
            <p className="mt-6 max-w-md font-sans text-[0.9375rem] leading-relaxed text-stone-300">{footer.intro}</p>
            {footer.tagline ? (
              <p className="mt-6 font-sans text-[0.75rem] uppercase tracking-eyebrow text-bronze">{footer.tagline}</p>
            ) : null}
          </div>

          <nav aria-label="Footer navigation" className="lg:col-span-2">
            <h2 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-400">
              Company
            </h2>
            <ul className="mt-5 space-y-3 font-sans text-[0.875rem]">
              {[...menu, ...extraLinks].map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <Link
                    to={item.to}
                    className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services" className="lg:col-span-2">
            <h2 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-400">
              Services
            </h2>
            <ul className="mt-5 space-y-3 font-sans text-[0.875rem]">
              {services.items
                .filter((service) => service.published)
                .map((service) => (
                  <li key={service.slug}>
                    <Link
                      to={`/services#${service.slug}`}
                      className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
                    >
                      {service.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-400">
              Contact
            </h2>
            <ul className="mt-5 space-y-4 font-sans text-[0.875rem]">
              <li>
                <a
                  href={`tel:${company.phone.tel}`}
                  className="flex items-start gap-3 transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
                >
                  <Phone className="mt-[0.15rem] h-4 w-4 shrink-0 text-bronze" />
                  {company.phone.display}
                </a>
              </li>
              <li>
                <a
                  href={defaultWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
                >
                  <WhatsApp className="mt-[0.15rem] h-4 w-4 shrink-0 text-bronze" />
                  Chat on WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-[0.15rem] h-4 w-4 shrink-0 text-bronze" />
                <span className="leading-relaxed">{company.addressFull}</span>
              </li>
              <li>
                <a
                  href={company.maps.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
                >
                  <Compass className="mt-[0.15rem] h-4 w-4 shrink-0 text-bronze" />
                  Get directions
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ivory/10 pt-6 font-sans text-[0.75rem] text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {company.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              to="/privacy"
              className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
            >
              Privacy policy
            </Link>
            <a
              href={company.maps.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
            >
              Google Maps listing
            </a>
            <Link
              to="/admin"
              className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
            >
              Admin
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
