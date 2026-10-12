import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Picture } from '../ui/Picture'
import { Reveal } from '../ui/Reveal'
import { Notice } from '../ui/Notice'
import { SectionHeading } from '../ui/SectionHeading'
import { ArrowRight } from '../ui/icons'
import { useContent } from '../../content/context'

/**
 * Service presentations.
 * variant="preview" → home page (imagery + summary + enquiry link)
 * variant="full"    → services page (adds description and scope list, and
 *                      carries the #slug anchors the rest of the site links to)
 */
export function ServicesSection({ variant = 'preview' }: { variant?: 'preview' | 'full' }) {
  const { services } = useContent()
  const detailed = variant === 'full'
  const items = services.items.filter((service) => service.published)

  return (
    <section
      id={detailed ? 'services' : undefined}
      className={`${detailed ? 'bg-ivory' : 'border-y border-charcoal/10 bg-white'} py-section lg:py-section-lg`}
      aria-labelledby="services-heading"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={services.eyebrow}
            title={
              <span id="services-heading">
                {services.heading}
                {services.headingAccent ? <span className="italic text-bronze">{services.headingAccent}</span> : null}
              </span>
            }
            intro={services.intro ? <p>{services.intro}</p> : undefined}
          />
        </Reveal>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {items.map((service, index) => {
            const reversed = index % 2 === 1
            return (
              <article
                key={service.slug}
                id={detailed ? service.slug : undefined}
                className="scroll-mt-28"
                aria-labelledby={`service-${service.slug}`}
              >
                <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
                  <Reveal className={`lg:col-span-6 ${reversed ? 'lg:order-2' : ''}`}>
                    <Picture image={service.image} sizes="(min-width: 1024px) 46vw, 92vw" ratio="aspect-[4/3]" />
                    {service.image.caption ? (
                      <p className="mt-3 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">
                        {service.image.caption}
                      </p>
                    ) : null}
                  </Reveal>

                  <div className={`lg:col-span-6 ${reversed ? 'lg:order-1 lg:pr-6' : 'lg:pl-6'}`}>
                    <Reveal delay={80}>
                      <p className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-bronze">
                        Service {service.index}
                      </p>
                      <h3
                        id={`service-${service.slug}`}
                        className="mt-4 font-display text-[2rem] leading-tight text-charcoal sm:text-[2.5rem]"
                      >
                        {service.title}
                      </h3>
                      <p className="mt-5 max-w-prose font-sans text-[1.0625rem] leading-relaxed text-stone-600">
                        {service.summary}
                      </p>

                      {detailed ? (
                        <div className="mt-6 max-w-prose space-y-5 font-sans text-[1rem] leading-relaxed text-stone-600">
                          {service.body.map((paragraph) => (
                            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                          ))}
                        </div>
                      ) : null}

                      <div className={detailed ? 'mt-8 border-t border-charcoal/10 pt-6' : 'mt-7'}>
                        {detailed ? (
                          <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal">
                            {service.scopeLabel}
                          </p>
                        ) : null}
                        <ul
                          className={
                            detailed
                              ? 'mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2'
                              : 'space-y-2.5'
                          }
                        >
                          {(detailed ? service.scope : service.scope.slice(0, 3)).map((item) => (
                            <li key={item} className="flex gap-3 font-sans text-[0.875rem] leading-relaxed text-stone-600">
                              <span aria-hidden="true" className="mt-[0.45rem] h-px w-3 shrink-0 bg-bronze" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                        <Link
                          to={`/contact?service=${encodeURIComponent(service.title)}#inquiry`}
                          className="group inline-flex items-center gap-2 font-sans text-[0.75rem] font-semibold uppercase tracking-eyebrow text-charcoal underline-offset-8 transition-colors hover:text-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
                        >
                          Enquire about this service
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                        {!detailed ? (
                          <Link
                            to={`/services#${service.slug}`}
                            className="font-sans text-[0.75rem] uppercase tracking-eyebrow text-stone-500 underline-offset-8 transition-colors hover:text-charcoal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4"
                          >
                            Service details
                          </Link>
                        ) : null}
                      </div>
                    </Reveal>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {detailed && services.notice ? (
          <Reveal delay={120}>
            <Notice className="mt-16" label="Draft service descriptions —">
              {services.notice}
            </Notice>
          </Reveal>
        ) : null}

        {!detailed ? (
          <Reveal delay={120}>
            <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-charcoal/10 pt-10">
              <ButtonLink to="/services" variant="outline" icon={<ArrowRight className="h-4 w-4" />}>
                All Services in Detail
              </ButtonLink>
              <p className="font-sans text-[0.8125rem] text-stone-500">
                Not sure which applies to your project? Describe it and we will advise.
              </p>
            </div>
          </Reveal>
        ) : null}
      </Container>
    </section>
  )
}
