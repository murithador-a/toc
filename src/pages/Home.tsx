import { Seo } from '../components/seo/Seo'
import { Hero } from '../components/site/Hero'
import { CapabilityStrip } from '../components/site/CapabilityStrip'
import { AboutPreview } from '../components/site/AboutPreview'
import { ServicesSection } from '../components/site/ServicesSection'
import { ProjectsPreview } from '../components/site/ProjectsPreview'
import { ProcessSection } from '../components/site/ProcessSection'
import { ReviewsSection } from '../components/site/ReviewsSection'
import { ContactBand } from '../components/site/ContactBand'
import { useContent } from '../content/context'

export default function Home() {
  const { seo, company, home } = useContent()

  return (
    <>
      <Seo
        title={seo.defaultTitle}
        description={seo.defaultDescription}
        path="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: company.legalName,
          url: `${seo.siteUrl.replace(/\/$/, '')}/`,
          about: { '@id': `${seo.siteUrl.replace(/\/$/, '')}/#organisation` },
          primaryImageOfPage: `${seo.siteUrl.replace(/\/$/, '')}${seo.ogImage}`,
          description: home.hero.subhead,
        }}
      />
      <Hero />
      <CapabilityStrip />
      <AboutPreview />
      <ServicesSection variant="preview" />
      <ProjectsPreview />
      <ProcessSection />
      <ReviewsSection />
      <ContactBand />
    </>
  )
}
