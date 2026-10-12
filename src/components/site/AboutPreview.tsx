import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Picture } from '../ui/Picture'
import { Reveal } from '../ui/Reveal'
import { Eyebrow } from '../ui/SectionHeading'
import { ArrowRight } from '../ui/icons'
import { useContent } from '../../content/context'

export function AboutPreview() {
  const { about } = useContent()
  const { preview } = about

  return (
    <section className="bg-ivory py-section lg:py-section-lg" aria-labelledby="about-preview-heading">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                  <Picture image={about.imageSmall} sizes="(min-width: 1024px) 32vw, 60vw" ratio="aspect-[4/3]" />
                </div>
                <div className="col-span-12 -mt-2">
                  <Picture image={about.imageLarge} sizes="(min-width: 1024px) 40vw, 90vw" ratio="aspect-[16/10]" />
                </div>
              </div>
              {about.imageNote ? (
                <p className="mt-4 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">
                  {about.imageNote}
                </p>
              ) : null}
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:pl-4">
            <Reveal delay={80}>
              <Eyebrow>{preview.eyebrow}</Eyebrow>
              <h2
                id="about-preview-heading"
                className="mt-6 max-w-xl font-display text-display-sm text-charcoal sm:text-display"
              >
                {preview.heading}
                {preview.headingAccent ? <span className="italic text-bronze">{preview.headingAccent}</span> : null}
              </h2>
              <div className="mt-7 max-w-prose space-y-5 font-sans text-[1.0625rem] leading-relaxed text-stone-600">
                {preview.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>

              {preview.pillars.length > 0 ? (
                <dl className="mt-9 grid gap-6 border-t border-charcoal/10 pt-7 sm:grid-cols-3">
                  {preview.pillars.map((pillar) => (
                    <div key={pillar.title}>
                      <dt className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-bronze">
                        {pillar.title}
                      </dt>
                      <dd className="mt-2 font-sans text-[0.8125rem] leading-relaxed text-stone-600">{pillar.body}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="mt-9">
                <ButtonLink to="/about" variant="outline" icon={<ArrowRight className="h-4 w-4" />}>
                  {preview.linkLabel}
                </ButtonLink>
              </div>

              {preview.note ? (
                <p className="mt-6 font-sans text-[0.75rem] leading-relaxed text-stone-500">
                  {preview.note}{' '}
                  <Link to="/about" className="underline underline-offset-4 hover:text-charcoal">
                    About page
                  </Link>
                </p>
              ) : null}
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
