import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { ArrowRight, Phone, WhatsApp } from '../components/ui/icons'
import { Wordmark } from '../components/brand/Wordmark'
import { useContent } from '../content/context'
import { defaultWhatsAppUrl } from '../lib/whatsapp'

export default function NotFound() {
  const { company } = useContent()

  return (
    <>
      <Seo
        title="Page not found | TOC Luxury Constructions Ltd"
        description="The page you were looking for could not be found. Continue to the TOC Luxury Constructions portfolio, services or contact page."
        path="/404"
        noindex
      />

      <section className="flex min-h-[70svh] items-center bg-ivory py-section lg:py-section-lg">
        <Container>
          <div className="max-w-2xl">
            <Wordmark />
            <p className="mt-12 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              Error 404
            </p>
            <h1 className="mt-5 font-display text-display-sm leading-tight text-charcoal sm:text-display lg:text-display-lg">
              That page is not here.
            </h1>
            <p className="mt-6 max-w-prose font-sans text-[1.0625rem] leading-relaxed text-stone-600">
              The link may be outdated, or the address may have been mistyped. Everything on this site is reachable
              from the routes below — or you can reach the company directly.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/" variant="primary" size="lg">
                Back to home
              </ButtonLink>
              <ButtonLink to="/projects" variant="outline" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                View portfolio
              </ButtonLink>
            </div>

            <ul className="mt-12 grid gap-4 border-t border-charcoal/10 pt-8 font-sans text-[0.9375rem] sm:grid-cols-3">
              <li>
                <Link
                  to="/services"
                  className="text-charcoal underline-offset-4 transition-colors hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  to="/contact#inquiry"
                  className="text-charcoal underline-offset-4 transition-colors hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
                >
                  Request a quote
                </Link>
              </li>
              <li>
                <Link
                  to="/consultation"
                  className="text-charcoal underline-offset-4 transition-colors hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
                >
                  Request a consultation
                </Link>
              </li>
            </ul>

            <div className="mt-10 flex flex-wrap gap-6 border-t border-charcoal/10 pt-8 font-sans text-[0.875rem]">
              <a
                href={`tel:${company.phone.tel}`}
                className="inline-flex items-center gap-2 text-charcoal underline-offset-4 hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
              >
                <Phone className="h-4 w-4 text-bronze" />
                {company.phone.display}
              </a>
              <a
                href={defaultWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-charcoal underline-offset-4 hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
              >
                <WhatsApp className="h-4 w-4 text-bronze" />
                WhatsApp
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
