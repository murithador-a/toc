import { Link } from 'react-router-dom'
import { Picture } from '../ui/Picture'
import { ArrowRight } from '../ui/icons'
import { useContent } from '../../content/context'
import type { ProjectItem } from '../../content/types'

type Props = {
  project: ProjectItem
  /** "large" spans two columns on desktop grids */
  size?: 'default' | 'large'
  sizes?: string
  ratio?: string
  priority?: boolean
}

export function ProjectCard({
  project,
  size = 'default',
  sizes = '(min-width: 1024px) 32vw, 92vw',
  ratio = 'aspect-[4/3]',
  priority = false,
}: Props) {
  const { projects } = useContent()
  const categoryLabel =
    projects.categories.find((category) => category.key === project.category)?.label ?? project.projectType

  return (
    <article data-toc-project={project.slug} className={`group ${size === 'large' ? 'lg:col-span-2' : ''}`}>
      <Link
        to={`/projects/${project.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
        aria-label={`View ${project.title} — ${project.projectType}`}
      >
        <div className="relative overflow-hidden bg-stone-100">
          <div className="transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.035]">
            <Picture image={project.cover} sizes={sizes} ratio={ratio} priority={priority} />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent opacity-90"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
            <span className="inline-flex items-center gap-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-ivory">
              View project
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </span>
            {project.isPlaceholder ? (
              <span className="border border-ivory/40 px-2.5 py-1 font-sans text-[0.5625rem] uppercase tracking-eyebrow text-ivory/85">
                Placeholder entry
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 className="font-display text-[1.5rem] leading-snug text-charcoal transition-colors group-hover:text-bronze">
            {project.title}
          </h3>
          <p className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-500">{categoryLabel}</p>
        </div>
        <p className="mt-2 font-sans text-[0.8125rem] leading-relaxed text-stone-600">
          {project.projectType}
          {project.location ? ` · ${project.location}` : ' · Location to be confirmed'}
        </p>
        {project.cover.caption ? (
          <p className="mt-2 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">
            {project.cover.caption}
          </p>
        ) : null}
      </Link>
    </article>
  )
}
