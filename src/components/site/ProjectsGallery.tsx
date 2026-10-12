import { useMemo, useState } from 'react'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { Notice } from '../ui/Notice'
import { ProjectCard } from './ProjectCard'
import { useContent, usePublishedProjects } from '../../content/context'

export function ProjectsGallery() {
  const { projects } = useContent()
  const published = usePublishedProjects()
  const [filter, setFilter] = useState<string>('all')

  // Only offer filters for categories that actually contain published entries.
  const categories = useMemo(
    () => projects.categories.filter((category) => published.some((project) => project.category === category.key)),
    [projects.categories, published],
  )

  const visible = useMemo(
    () => (filter === 'all' ? published : published.filter((project) => project.category === filter)),
    [filter, published],
  )

  const anyPlaceholder = published.some((project) => project.isPlaceholder)

  return (
    <section
      id="portfolio"
      className="scroll-mt-24 bg-ivory pb-section pt-12 lg:pb-section-lg lg:pt-16"
      aria-labelledby="portfolio-heading"
    >
      <Container>
        <h2 id="portfolio-heading" className="sr-only">
          Project portfolio
        </h2>

        {published.length === 0 ? (
          <Reveal>
            <Notice label="Portfolio in preparation —">
              No projects have been published yet. Published projects appear here automatically, alongside their
              photographs, project type, location and scope of works.
            </Notice>
          </Reveal>
        ) : null}

        {categories.length > 1 ? (
          <Reveal>
            <div className="flex flex-wrap items-center gap-3 border-b border-charcoal/10 pb-6">
              <span className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">Filter</span>
              {[{ key: 'all', label: 'All entries' }, ...categories].map((category) => {
                const active = filter === category.key
                const count =
                  category.key === 'all'
                    ? published.length
                    : published.filter((project) => project.category === category.key).length
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setFilter(category.key)}
                    aria-pressed={active}
                    className={`border px-4 py-2 font-sans text-[0.6875rem] uppercase tracking-eyebrow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 ${
                      active
                        ? 'border-charcoal bg-charcoal text-ivory'
                        : 'border-charcoal/20 text-stone-600 hover:border-charcoal hover:text-charcoal'
                    }`}
                  >
                    {category.label}
                    <span className={`ml-2 ${active ? 'text-ivory/60' : 'text-stone-400'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </Reveal>
        ) : null}

        <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project, index) => (
            <Reveal key={project.slug} delay={index * 70}>
              <ProjectCard
                project={project}
                priority={index < 2}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                ratio="aspect-[5/4]"
              />
            </Reveal>
          ))}
        </div>

        {anyPlaceholder && projects.notice ? (
          <Reveal delay={140}>
            <Notice className="mt-16" label="Portfolio in preparation —">
              {projects.notice}
            </Notice>
          </Reveal>
        ) : null}
      </Container>
    </section>
  )
}
