import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/site/PageHero'
import { ServicesSection } from '../components/site/ServicesSection'
import { ProcessSection } from '../components/site/ProcessSection'
import { CtaBand } from '../components/site/CtaBand'
import { useContent } from '../content/context'

export default function Services() {
  const { services, seo, company, cta } = useContent()
  const base = seo.siteUrl.replace(/\/$/, '')

  return (
    <>
      <Seo
        title={`Construction Services in Osogbo, Osun State | ${company.legalName}`}
        description="Building construction, luxury residential homes, civil engineering and structural works, and project supervision and consultancy — delivered from Osogbo across Osun State by TOC Luxury Constructions Ltd."
        path="/services"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
              { '@type': 'ListItem', position: 2, name: 'Services', item: `${base}/services` },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Construction services offered by ${company.legalName}`,
            itemListElement: services.items
              .filter((service) => service.published)
              .map((service, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Service',
                  name: service.title,
                  description: service.summary,
                  serviceType: service.title,
                  provider: { '@id': `${base}/#organisation` },
                  areaServed: { '@type': 'AdministrativeArea', name: 'Osun State, Nigeria' },
                },
              })),
          },
        ]}
      />

      <PageHero
        eyebrow={services.eyebrow}
        breadcrumb="Services"
        title={
          <>
            {services.heading}
            {services.headingAccent ? <span className="italic text-bronze">{services.headingAccent}</span> : null}
          </>
        }
        intro={
          <p>
            Each service is delivered as an agreed scope with defined stages, one responsible team, and reporting you
            can act on.
          </p>
        }
        image={services.items[0]?.image}
      />

      <ServicesSection variant="full" />
      <ProcessSection tone="dark" />
      <CtaBand band={cta.services} />
    </>
  )
}
