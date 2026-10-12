import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { useContent } from '../../content/context'

/** Native <details> so the answers work even if JavaScript never loads. */
export function FaqSection({ className = '' }: { className?: string }) {
  const { faqs } = useContent()

  if (faqs.items.length === 0) return null

  return (
    <section className={`bg-ivory py-section lg:py-section-lg ${className}`} aria-labelledby="faq-heading">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              <span aria-hidden="true" className="h-px w-8 bg-bronze" />
              {faqs.eyebrow}
            </p>
            <h2 id="faq-heading" className="mt-6 font-display text-display-sm text-charcoal sm:text-display">
              {faqs.heading}
              {faqs.headingAccent ? <span className="italic text-bronze">{faqs.headingAccent}</span> : null}
            </h2>
          </Reveal>

          <div className="lg:col-span-8">
            <dl className="border-t border-charcoal/10">
              {faqs.items.map((faq, index) => (
                <Reveal key={faq.question} delay={index * 50}>
                  <details className="group border-b border-charcoal/10">
                    <summary className="flex cursor-pointer items-start justify-between gap-6 py-6 font-display text-[1.25rem] text-charcoal transition-colors hover:text-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 sm:text-[1.375rem]">
                      {faq.question}
                      <span
                        aria-hidden="true"
                        className="mt-1 shrink-0 font-sans text-[1.25rem] leading-none text-bronze transition-transform duration-300 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <dd className="max-w-prose pb-7 font-sans text-[1rem] leading-relaxed text-stone-600">{faq.answer}</dd>
                  </details>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  )
}
