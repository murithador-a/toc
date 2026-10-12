import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/site/PageHero'
import { ProjectsGallery } from '../components/site/ProjectsGallery'
import { CtaBand } from '../components/site/CtaBand'
import { useContent } from '../content/context'

export default function Projects() {
  const { projects, seo, company, cta } = useContent()
  const base = seo.siteUrl.replace(/\/$/, '')

  return (
    <>
      <Seo
        title={`Construction Projects & Portfolio | ${company.legalName}`}
        description="The project portfolio of TOC Luxury Constructions Ltd — residential construction, luxury residential homes and structural works in Osogbo and across Osun State."
        path="/projects"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `Project portfolio — ${company.legalName}`,
          url: `${base}/projects`,
          about: { '@id': `${base}/#organisation` },
        }}
      />

      <PageHero
        eyebrow={projects.eyebrow}
        breadcrumb="Projects"
        title={
          <>
            {projects.heading}
            {projects.headingAccent ? <span className="italic text-bronze">{projects.headingAccent}</span> : null}
          </>
        }
        intro={projects.intro ? <p>{projects.intro}</p> : undefined}
      />

      <ProjectsGallery />
      <CtaBand band={cta.projects} />
    </>
  )
}
