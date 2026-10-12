import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { Notice } from '../ui/Notice'
import { useContent } from '../../content/context'

export function ProcessSection({ tone = 'ivory' }: { tone?: 'ivory' | 'dark' }) {
  const { process } = useContent()
  const dark = tone === 'dark'

  if (process.stages.length === 0) return null

  return (
    <section
      id="process"
      className={`${dark ? 'bg-charcoal' : 'border-y border-charcoal/10 bg-white'} py-section lg:py-section-lg`}
      aria-labelledby="process-heading"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={process.eyebrow}
            tone={dark ? 'light' : 'dark'}
            title={
              <span id="process-heading">
                {process.heading}
                {process.headingAccent ? <span className="italic text-bronze">{process.headingAccent}</span> : null}
              </span>
            }
            intro={process.intro ? <p className={dark ? 'text-stone-300' : undefined}>{process.intro}</p> : undefined}
          />
        </Reveal>

        {/* Desktop: horizontal timeline. Mobile: vertical sequence. */}
        <div className="mt-14 hidden lg:block">
          <div className="relative">
            <div
              aria-hidden="true"
              className={`absolute left-0 right-0 top-[1.45rem] h-px ${dark ? 'bg-ivory/15' : 'bg-charcoal/10'}`}
            />
            <ol className="relative grid grid-cols-4 gap-8">
              {process.stages.map((stage, index) => (
                <Reveal as="li" key={`${stage.index}-${stage.title}`} delay={index * 90}>
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex h-[2.9rem] w-[2.9rem] shrink-0 items-center justify-center border font-sans text-[0.75rem] font-semibold tracking-wide2 ${
                        dark ? 'border-bronze/60 bg-charcoal text-bronze' : 'border-bronze/50 bg-white text-bronze'
                      }`}
                    >
                      {stage.index}
                    </span>
                  </div>
                  <h3 className={`mt-6 font-display text-[1.5rem] ${dark ? 'text-ivory' : 'text-charcoal'}`}>
                    {stage.title}
                  </h3>
                  <p className={`mt-3 font-sans text-[0.875rem] leading-relaxed ${dark ? 'text-stone-300' : 'text-stone-600'}`}>
                    {stage.description}
                  </p>
                  <p
                    className={`mt-4 border-t pt-4 font-sans text-[0.75rem] leading-relaxed ${
                      dark ? 'border-ivory/10 text-stone-400' : 'border-charcoal/10 text-stone-500'
                    }`}
                  >
                    <span className="font-semibold uppercase tracking-eyebrow text-[0.625rem] text-bronze">Result </span>
                    {stage.outcome}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>

        <ol className="mt-12 space-y-10 lg:hidden">
          {process.stages.map((stage, index) => (
            <Reveal as="li" key={`${stage.index}-${stage.title}`} delay={index * 60} className="relative border-l border-bronze/40 pl-6">
              <span className="absolute -left-[0.6rem] top-0 flex h-[1.2rem] w-[1.2rem] items-center justify-center bg-bronze" />
              <span className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-bronze">Stage {stage.index}</span>
              <h3 className={`mt-2 font-display text-[1.6rem] ${dark ? 'text-ivory' : 'text-charcoal'}`}>{stage.title}</h3>
              <p className={`mt-3 font-sans text-[0.9375rem] leading-relaxed ${dark ? 'text-stone-300' : 'text-stone-600'}`}>
                {stage.description}
              </p>
              <p className={`mt-3 font-sans text-[0.75rem] leading-relaxed ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                <span className="font-semibold uppercase tracking-eyebrow text-[0.625rem] text-bronze">Result </span>
                {stage.outcome}
              </p>
            </Reveal>
          ))}
        </ol>

        {process.notice ? (
          <Reveal delay={120}>
            <Notice className="mt-14" tone={dark ? 'dark' : 'light'} label="Proposed process —">
              {process.notice}
            </Notice>
          </Reveal>
        ) : null}
      </Container>
    </section>
  )
}
