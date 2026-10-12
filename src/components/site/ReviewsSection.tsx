import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { RatingStars, RatingText } from '../ui/Rating'
import { SectionHeading } from '../ui/SectionHeading'
import { ArrowRight, WhatsApp } from '../ui/icons'
import { useContent } from '../../content/context'
import { defaultWhatsAppUrl } from '../../lib/whatsapp'

export function ReviewsSection() {
  const { reviews } = useContent()
  const { rating, excerpts } = reviews

  return (
    <section className="bg-ivory py-section lg:py-section-lg" aria-labelledby="reviews-heading">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <SectionHeading
              eyebrow={reviews.eyebrow}
              title={
                <span id="reviews-heading">
                  {reviews.heading}
                  {reviews.headingAccent ? <span className="italic text-bronze">{reviews.headingAccent}</span> : null}
                </span>
              }
              intro={reviews.intro ? <p>{reviews.intro}</p> : undefined}
            />
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal delay={90}>
              <div className="border border-charcoal/10 bg-white p-8 sm:p-10">
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="font-display text-[3.5rem] leading-none text-charcoal">{rating.value}</p>
                    <p className="mt-2 font-sans text-[0.75rem] uppercase tracking-wide2 text-stone-500">
                      out of {rating.max}
                    </p>
                  </div>
                  <div className="text-right">
                    <RatingStars value={rating.value} className="justify-end" />
                    <p className="mt-3 font-sans text-[0.8125rem] text-stone-600">
                      Based on {rating.count} {rating.source} reviews
                    </p>
                    <p className="mt-1 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">
                      Source: {rating.source}
                    </p>
                  </div>
                </div>

                <p className="sr-only">
                  <RatingText value={rating.value} max={rating.max} count={rating.count} />
                </p>

                {rating.note ? (
                  <div className="mt-8 border-t border-charcoal/10 pt-6">
                    <p className="font-sans text-[0.8125rem] leading-relaxed text-stone-500">{rating.note}</p>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink to={rating.sourceUrl} external variant="outline" icon={<ArrowRight className="h-4 w-4" />}>
                    Read reviews on {rating.source}
                  </ButtonLink>
                  <ButtonLink to={defaultWhatsAppUrl()} external variant="primary" icon={<WhatsApp className="h-4 w-4" />}>
                    Talk to us on WhatsApp
                  </ButtonLink>
                </div>
              </div>
            </Reveal>

            {excerpts.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {excerpts.map((excerpt, index) => (
                  <Reveal key={`${excerpt.author}-${index}`} delay={60}>
                    <blockquote className="h-full border-l-2 border-bronze bg-white p-6">
                      <RatingStars value={rating.max} />
                      <p className="mt-4 font-display text-[1.125rem] leading-relaxed text-charcoal">
                        &ldquo;{excerpt.quote}&rdquo;
                      </p>
                      <footer className="mt-4 font-sans text-[0.75rem] uppercase tracking-eyebrow text-stone-500">
                        {excerpt.author} · via {rating.source}
                      </footer>
                    </blockquote>
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}
