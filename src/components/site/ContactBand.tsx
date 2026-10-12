import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { ArrowRight, Compass, MapPin, Phone, WhatsApp } from '../ui/icons'
import { useContent } from '../../content/context'
import { defaultWhatsAppUrl } from '../../lib/whatsapp'

export function ContactBand() {
  const { cta, company } = useContent()
  const band = cta.contactBand

  return (
    <section id="contact" className="bg-charcoal py-section lg:py-section-lg" aria-labelledby="contact-band-heading">
      <Container>
        <div className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              <span aria-hidden="true" className="h-px w-8 bg-bronze" />
              {band.eyebrow}
            </p>
            <h2
              id="contact-band-heading"
              className="mt-6 max-w-xl font-display text-display-sm text-ivory sm:text-display lg:text-display-lg"
            >
              {band.title}
            </h2>
            <p className="mt-7 max-w-prose font-sans text-[1.0625rem] leading-relaxed text-stone-300">{band.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/contact#inquiry" variant="inverse" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                {band.primaryLabel}
              </ButtonLink>
              <ButtonLink to={defaultWhatsAppUrl()} external variant="quiet" size="lg" icon={<WhatsApp className="h-4 w-4" />}>
                {band.secondaryLabel}
              </ButtonLink>
            </div>
            <p className="mt-5 max-w-lg font-sans text-[0.75rem] leading-relaxed text-stone-400">
              {company.whatsapp.note}
            </p>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-6 lg:pl-10">
            <div className="border-t border-ivory/15 pt-8">
              <h3 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-400">
                Visit or call
              </h3>
              <ul className="mt-6 space-y-7">
                <li className="flex gap-4">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-bronze" />
                  <div>
                    <p className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">Office</p>
                    <p className="mt-1 font-sans text-[1rem] leading-relaxed text-ivory">{company.addressFull}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-bronze" />
                  <div>
                    <p className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">Phone</p>
                    <a
                      href={`tel:${company.phone.tel}`}
                      className="mt-1 inline-block font-sans text-[1rem] text-ivory underline-offset-4 transition-colors hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
                    >
                      {company.phone.display}
                    </a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Compass className="mt-1 h-5 w-5 shrink-0 text-bronze" />
                  <div>
                    <p className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">Directions</p>
                    <a
                      href={company.maps.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-2 font-sans text-[1rem] text-ivory underline-offset-4 transition-colors hover:text-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-charcoal"
                    >
                      Get directions on Google Maps
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
