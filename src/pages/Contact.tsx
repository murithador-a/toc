import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/site/PageHero'
import { Container } from '../components/ui/Container'
import { Reveal } from '../components/ui/Reveal'
import { InquiryForm } from '../components/site/InquiryForm'
import { MapPanel } from '../components/site/MapPanel'
import { FaqSection } from '../components/site/FaqSection'
import { ButtonLink } from '../components/ui/Button'
import { ArrowRight, Compass, MapPin, Phone, WhatsApp } from '../components/ui/icons'
import { useContent } from '../content/context'
import { defaultWhatsAppUrl } from '../lib/whatsapp'

export default function Contact() {
  const { contact, seo, company } = useContent()
  const base = seo.siteUrl.replace(/\/$/, '')

  const cards = [
    {
      icon: <Phone className="h-5 w-5 text-bronze" />,
      label: 'Call the office',
      value: company.phone.display,
      description: company.hasOpeningHours
        ? `Speak to us directly. ${company.openingHours}`
        : 'Speak to us directly during working hours. Opening hours to be confirmed.',
      href: `tel:${company.phone.tel}`,
      action: 'Call now',
      external: false,
    },
    {
      icon: <WhatsApp className="h-5 w-5 text-bronze" />,
      label: 'WhatsApp',
      value: company.whatsapp.display,
      description: 'The quickest route for photographs, plans and site questions.',
      href: defaultWhatsAppUrl(),
      action: 'Open WhatsApp',
      external: true,
    },
    {
      icon: <MapPin className="h-5 w-5 text-bronze" />,
      label: 'Office',
      value: company.address.street,
      description: `${company.address.locality} ${company.address.postalCode}, ${company.address.region}`,
      href: company.maps.listingUrl,
      action: 'View listing',
      external: true,
    },
    {
      icon: <Compass className="h-5 w-5 text-bronze" />,
      label: 'Directions',
      value: 'Google Maps',
      description: `Turn-by-turn directions to ${company.address.street}.`,
      href: company.maps.directionsUrl,
      action: 'Get directions',
      external: true,
    },
  ]

  return (
    <>
      <Seo
        title={`Contact ${company.legalName} | Osogbo, Osun State`}
        description={`Contact ${company.legalName} at ${company.addressFull}. Call ${company.phone.display}, message us on WhatsApp, request a construction quote or book a consultation.`}
        path="/contact"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: `Contact ${company.legalName}`,
          url: `${base}/contact`,
          about: { '@id': `${base}/#organisation` },
          mainEntity: {
            '@type': 'GeneralContractor',
            '@id': `${base}/#organisation`,
            name: company.legalName,
            telephone: company.phone.tel,
            address: {
              '@type': 'PostalAddress',
              streetAddress: company.address.street,
              addressLocality: company.address.locality,
              postalCode: company.address.postalCode,
              addressRegion: company.address.region,
              addressCountry: company.address.countryCode,
            },
          },
        }}
      />

      <PageHero
        eyebrow={contact.hero.eyebrow}
        breadcrumb={contact.hero.breadcrumb}
        title={
          <>
            {contact.hero.heading}
            {contact.hero.headingAccent ? (
              <span className="italic text-bronze">{contact.hero.headingAccent}</span>
            ) : null}
          </>
        }
        intro={contact.hero.intro ? <p>{contact.hero.intro}</p> : undefined}
      />

      <section className="border-b border-charcoal/10 bg-ivory pb-section" aria-label="Contact details">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
              <Reveal key={card.label} delay={index * 70}>
                <div className="flex h-full flex-col border border-charcoal/10 bg-white p-6">
                  {card.icon}
                  <p className="mt-5 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-stone-500">
                    {card.label}
                  </p>
                  <p className="mt-2 font-display text-[1.25rem] leading-snug text-charcoal">{card.value}</p>
                  <p className="mt-3 flex-1 font-sans text-[0.8125rem] leading-relaxed text-stone-600">
                    {card.description}
                  </p>
                  <a
                    href={card.href}
                    {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group mt-5 inline-flex items-center gap-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal underline-offset-8 transition-colors hover:text-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4"
                  >
                    {card.action}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <MapPanel className="mt-10" />
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border border-charcoal/10 bg-white p-8">
              <div>
                <p className="font-display text-[1.5rem] text-charcoal">Prefer to arrange a consultation?</p>
                <p className="mt-2 max-w-xl font-sans text-[0.9375rem] leading-relaxed text-stone-600">
                  Send a request with your preferred date and time band. We will confirm an actual time with you by
                  phone or WhatsApp.
                </p>
              </div>
              <ButtonLink to="/consultation" variant="outline" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Request a Consultation
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      <InquiryForm />
      <FaqSection />
    </>
  )
}
