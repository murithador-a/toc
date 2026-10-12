import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/site/PageHero'
import { ConsultationForm } from '../components/site/ConsultationForm'
import { FaqSection } from '../components/site/FaqSection'
import { CtaBand } from '../components/site/CtaBand'
import { useContent } from '../content/context'

export default function Consultation() {
  const { consultation, seo, company, cta } = useContent()
  const base = seo.siteUrl.replace(/\/$/, '')

  return (
    <>
      <Seo
        title={`Request a Construction Consultation | ${company.legalName}`}
        description="Request a construction consultation with TOC Luxury Constructions Ltd in Osogbo, Osun State. Send your preferred date and time and we will confirm an actual appointment with you."
        path="/consultation"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Request a construction consultation',
          url: `${base}/consultation`,
          about: { '@id': `${base}/#organisation` },
        }}
      />

      <PageHero
        eyebrow={consultation.hero.eyebrow}
        breadcrumb={consultation.hero.breadcrumb}
        title={
          <>
            {consultation.hero.heading}
            {consultation.hero.headingAccent ? (
              <span className="italic text-bronze">{consultation.hero.headingAccent}</span>
            ) : null}
          </>
        }
        intro={consultation.hero.intro ? <p>{consultation.hero.intro}</p> : undefined}
      />

      <ConsultationForm />
      <FaqSection />
      <CtaBand band={cta.consultation} />
    </>
  )
}
