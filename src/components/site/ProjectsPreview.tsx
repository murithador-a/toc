import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { Notice } from '../ui/Notice'
import { ArrowRight } from '../ui/icons'
import { ProjectCard } from './ProjectCard'
import { useContent, usePublishedProjects } from '../../content/context'

export function ProjectsPreview() {
  const { projects } = useContent()
  const published = usePublishedProjects()
  const featured = published.slice(0, 3)
  const anyPlaceholder = published.some((project) => project.isPlaceholder)

  if (featured.length === 0) return null

  return (
    <section id="projects" className="scroll-mt-24 bg-ivory py-section lg:py-section-lg" aria-labelledby="projects-heading">
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              eyebrow="Selected Work"
              title={
                <span id="projects-heading">
                  {projects.homeHeading}
                  {projects.homeHeadingAccent ? (
                    <span className="italic text-bronze">{projects.homeHeadingAccent}</span>
                  ) : null}
                </span>
              }
              intro={projects.homeIntro ? <p>{projects.homeIntro}</p> : undefined}
            />
            <ButtonLink to="/projects" variant="outline" icon={<ArrowRight className="h-4 w-4" />}>
              View Full Portfolio
            </ButtonLink>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {featured.map((project, index) => (
            <Reveal key={project.slug} delay={index * 90}>
              <ProjectCard project={project} priority={index === 0} />
            </Reveal>
          ))}
        </div>

        {anyPlaceholder && projects.notice ? (
          <Reveal delay={140}>
            <Notice className="mt-14" label="Portfolio in preparation —">
              {projects.notice}
            </Notice>
          </Reveal>
        ) : null}
      </Container>
    </section>
  )
}
