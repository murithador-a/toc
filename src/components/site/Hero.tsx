import { Container } from '../ui/Container'
import { ButtonAnchor, ButtonLink } from '../ui/Button'
import { Picture } from '../ui/Picture'
import { Reveal } from '../ui/Reveal'
import { ArrowDown, MapPin } from '../ui/icons'
import { useContent } from '../../content/context'

export function Hero() {
  const { home, company } = useContent()
  const { hero } = home

  return (
    <section className="relative isolate overflow-hidden bg-charcoal" aria-labelledby="hero-heading">
      <div className="absolute inset-0 h-full w-full">
        <Picture image={hero.image} priority bare sizes="100vw" className="h-full w-full" ratio="" />
        {/* Two-layer scrim: a flat wash guarantees contrast across the whole
            frame, the gradient adds weight at the bottom where the copy sits. */}
        <div aria-hidden="true" className="absolute inset-0 bg-charcoal/45" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-charcoal/25" />
      </div>

      <Container className="relative z-10 flex min-h-[88svh] flex-col justify-end pb-10 pt-32 sm:min-h-[92svh] sm:pb-14">
        <div className="max-w-3xl">
          <Reveal>
            <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              <span aria-hidden="true" className="h-px w-8 bg-bronze" />
              {hero.eyebrow}
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1
              id="hero-heading"
              className="mt-7 font-display text-[2.6rem] leading-[1.05] text-ivory sm:text-display-lg lg:text-display-xl"
            >
              {hero.headline}
              {hero.headlineAccent ? (
                <>
                  <br />
                  <span className="italic text-stone-200">{hero.headlineAccent}</span>
                </>
              ) : null}
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-7 max-w-xl font-sans text-[1.0625rem] leading-relaxed text-stone-200 sm:text-[1.125rem]">
              {hero.subhead}
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonAnchor href="#projects" variant="inverse" size="lg" icon={<ArrowDown className="h-4 w-4" />}>
                {hero.primaryCtaLabel}
              </ButtonAnchor>
              <ButtonLink to="/contact#inquiry" variant="quiet" size="lg">
                {hero.secondaryCtaLabel}
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        <Reveal delay={340} className="mt-14 border-t border-ivory/15 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="inline-flex items-center gap-2.5 font-sans text-[0.75rem] uppercase tracking-wide2 text-stone-300">
              <MapPin className="h-4 w-4 text-bronze" />
              {company.addressShort}
            </p>
            {hero.imageNote ? (
              <p className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-ivory/45">{hero.imageNote}</p>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
