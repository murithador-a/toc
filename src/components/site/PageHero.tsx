import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { Picture } from '../ui/Picture'
import type { ContentImage } from '../../content/types'

export function PageHero({
  eyebrow,
  title,
  intro,
  breadcrumb,
  image,
}: {
  eyebrow: string
  title: ReactNode
  intro?: ReactNode
  breadcrumb: string
  image?: ContentImage
}) {
  return (
    <section className="border-b border-charcoal/10 bg-ivory pb-14 pt-14 lg:pb-20 lg:pt-20">
      <Container>
        <Reveal>
          <nav aria-label="Breadcrumb" className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-500">
            <ol className="flex items-center gap-3">
              <li>
                <Link
                  to="/"
                  className="transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-stone-400">
                /
              </li>
              <li aria-current="page" className="text-charcoal">
                {breadcrumb}
              </li>
            </ol>
          </nav>
        </Reveal>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              <span aria-hidden="true" className="h-px w-8 bg-bronze" />
              {eyebrow}
            </p>
            <h1 className="mt-6 font-display text-display-sm leading-[1.06] text-charcoal sm:text-display lg:text-display-lg">
              {title}
            </h1>
          </Reveal>
          {intro ? (
            <Reveal delay={90} className="lg:col-span-5 lg:pt-14">
              <div className="max-w-prose space-y-4 font-sans text-[1.0625rem] leading-relaxed text-stone-600">{intro}</div>
            </Reveal>
          ) : null}
        </div>

        {image ? (
          <Reveal delay={140}>
            <Picture
              image={image}
              priority
              sizes="100vw"
              ratio="aspect-[16/9] lg:aspect-[21/9]"
              className="mt-14 bg-stone-100"
            />
            {image.caption ? (
              <p className="mt-3 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">{image.caption}</p>
            ) : null}
          </Reveal>
        ) : null}
      </Container>
    </section>
  )
}
