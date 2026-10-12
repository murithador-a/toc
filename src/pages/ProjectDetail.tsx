import { Link, Navigate, useParams } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { Container } from '../components/ui/Container'
import { Reveal } from '../components/ui/Reveal'
import { Notice } from '../components/ui/Notice'
import { Picture } from '../components/ui/Picture'
import { ButtonLink } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/SectionHeading'
import { ArrowRight, WhatsApp } from '../components/ui/icons'
import { useContent } from '../content/context'
import { defaultWhatsAppUrl } from '../lib/whatsapp'

export default function ProjectDetail() {
  const { slug = '' } = useParams()
  const content = useContent()
  const { projects, seo, company, cta } = content
  const base = seo.siteUrl.replace(/\/$/, '')

  // Drafts are not part of the public document, so an unknown slug is a 404.
  const list = projects.items.filter((item) => item.status === 'published').sort((a, b) => a.order - b.order)
  const project = list.find((item) => item.slug === slug)

  if (!project) return <Navigate to="/projects" replace />

  const index = list.findIndex((item) => item.slug === project.slug)
  const previous = index > 0 ? list[index - 1] : null
  const next = index < list.length - 1 ? list[index + 1] : null
  const categoryLabel = projects.categories.find((category) => category.key === project.category)?.label ?? project.projectType

  const meta: [string, string][] = [
    ['Project type', project.projectType],
    ['Category', categoryLabel],
    ['Location', project.location || 'To be confirmed'],
    ['Completed', project.yearCompleted || 'To be confirmed'],
    ['Client', project.client || 'Not published'],
    ['Status', project.isPlaceholder ? 'Layout placeholder — not a completed TOC record' : 'Verified project'],
  ]

  return (
    <>
      <Seo
        title={`${project.title} | Projects | ${company.legalName}`}
        description={project.summary || `Portfolio entry held in the ${company.legalName} project gallery.`}
        path={`/projects/${project.slug}`}
        noindex={project.isPlaceholder}
        type="article"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
            { '@type': 'ListItem', position: 2, name: 'Projects', item: `${base}/projects` },
            { '@type': 'ListItem', position: 3, name: project.title, item: `${base}/projects/${project.slug}` },
          ],
        }}
      />

      <article>
        <section className="border-b border-charcoal/10 bg-ivory pb-12 pt-12 lg:pb-16 lg:pt-16">
          <Container>
            <Reveal>
              <nav aria-label="Breadcrumb" className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-500">
                <ol className="flex flex-wrap items-center gap-3">
                  <li>
                    <Link to="/" className="transition-colors hover:text-charcoal">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link to="/projects" className="transition-colors hover:text-charcoal">
                      Projects
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="text-charcoal">
                    {project.title}
                  </li>
                </ol>
              </nav>
            </Reveal>

            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-7">
                <Eyebrow>{categoryLabel}</Eyebrow>
                <h1 className="mt-6 font-display text-display-sm leading-[1.06] text-charcoal sm:text-display lg:text-display-lg">
                  {project.title}
                </h1>
                {project.summary ? (
                  <p className="mt-6 max-w-prose font-sans text-[1.0625rem] leading-relaxed text-stone-600">
                    {project.summary}
                  </p>
                ) : null}
              </Reveal>

              <Reveal delay={90} className="lg:col-span-5 lg:pt-4">
                <dl className="divide-y divide-charcoal/10 border-y border-charcoal/10">
                  {meta.map(([term, value]) => (
                    <div key={term} className="flex justify-between gap-6 py-3.5">
                      <dt className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-500">{term}</dt>
                      <dd className="text-right font-sans text-[0.875rem] leading-relaxed text-charcoal">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </Container>
        </section>

        <section className="bg-white py-12 lg:py-16" aria-label="Project imagery">
          <Container>
            <Reveal>
              <Picture image={project.cover} priority sizes="100vw" ratio="aspect-[16/9]" />
              {project.cover.caption ? (
                <p className="mt-3 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">
                  {project.cover.caption}
                </p>
              ) : null}
            </Reveal>
          </Container>
        </section>

        <section className="bg-white pb-section lg:pb-section-lg" aria-labelledby="project-context">
          <Container>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-7">
                <h2 id="project-context" className="font-display text-[2rem] text-charcoal">
                  Project context
                </h2>
                <div className="mt-6 max-w-prose space-y-5 font-sans text-[1.0625rem] leading-relaxed text-stone-600">
                  {project.description.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>

                {project.isPlaceholder ? (
                  <Notice className="mt-8" label="Placeholder entry —">
                    This page demonstrates the structure of a project record. Names, locations, dates, values and
                    specifications are published only once verified with TOC, and the imagery shown is licensed
                    reference photography, not completed TOC work.
                  </Notice>
                ) : null}
              </Reveal>

              <Reveal delay={90} className="lg:col-span-5">
                <h3 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal">
                  Scope of works
                </h3>
                <ul className="mt-5 space-y-3 border-t border-charcoal/10 pt-5">
                  {project.scope.map((item) => (
                    <li key={item} className="flex gap-3 font-sans text-[0.9375rem] leading-relaxed text-stone-600">
                      <span aria-hidden="true" className="mt-[0.55rem] h-px w-3 shrink-0 bg-bronze" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            {project.gallery.length > 0 ? (
              <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {project.gallery.map((image, imageIndex) => (
                  <Reveal key={`${image.src}-${imageIndex}`} delay={imageIndex * 70}>
                    <Picture image={image} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" ratio="aspect-[4/3]" />
                    {image.caption ? (
                      <p className="mt-3 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">
                        {image.caption}
                      </p>
                    ) : null}
                  </Reveal>
                ))}
              </div>
            ) : null}
          </Container>
        </section>

        <section className="border-y border-charcoal/10 bg-ivory py-12 lg:py-16" aria-label="Discuss a similar project">
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div>
                <h2 className="font-display text-[1.75rem] text-charcoal sm:text-[2.25rem]">
                  {cta.projectDetail.heading}
                </h2>
                <p className="mt-3 max-w-prose font-sans text-[0.9375rem] leading-relaxed text-stone-600">
                  {cta.projectDetail.body}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink to="/contact#inquiry" variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                  Request a Quote
                </ButtonLink>
                <ButtonLink to={defaultWhatsAppUrl()} external variant="outline" size="lg" icon={<WhatsApp className="h-4 w-4" />}>
                  WhatsApp
                </ButtonLink>
              </div>
            </div>

            <nav aria-label="Other portfolio entries" className="mt-12 grid gap-4 border-t border-charcoal/10 pt-8 sm:grid-cols-2">
              {previous ? (
                <Link
                  to={`/projects/${previous.slug}`}
                  className="group flex items-center gap-4 py-2 font-sans text-[0.875rem] text-stone-600 transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4"
                >
                  <ArrowRight className="h-4 w-4 rotate-180 text-bronze" />
                  <span>
                    <span className="block text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Previous</span>
                    {previous.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  to={`/projects/${next.slug}`}
                  className="group flex items-center justify-end gap-4 py-2 text-right font-sans text-[0.875rem] text-stone-600 transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4"
                >
                  <span>
                    <span className="block text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Next</span>
                    {next.title}
                  </span>
                  <ArrowRight className="h-4 w-4 text-bronze" />
                </Link>
              ) : null}
            </nav>
          </Container>
        </section>
      </article>
    </>
  )
}
