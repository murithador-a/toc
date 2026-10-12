import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { ArrowRight, WhatsApp } from '../ui/icons'
import { defaultWhatsAppUrl } from '../../lib/whatsapp'
import type { CtaBandContent } from '../../content/types'

/**
 * Reusable conversion band for inner pages.
 * Pass a `band` straight from content (cta.about, cta.services, …) so its copy is
 * editable in the admin; the individual props remain for one-off placements.
 */
export function CtaBand({
  band,
  eyebrow,
  title,
  body,
  primaryLabel = 'Request a Quote',
  primaryTo = '/contact#inquiry',
  secondaryLabel = 'Request a Consultation',
  secondaryTo = '/consultation',
}: {
  band?: CtaBandContent
  eyebrow?: string
  title?: string
  body?: string
  primaryLabel?: string
  primaryTo?: string
  secondaryLabel?: string
  secondaryTo?: string
}) {
  eyebrow = band?.eyebrow ?? eyebrow ?? 'Next step'
  title = band?.title ?? title ?? ''
  body = band?.body ?? body ?? ''
  primaryLabel = band?.primaryLabel ?? primaryLabel
  secondaryLabel = band?.secondaryLabel ?? secondaryLabel

  return (
    <section className="border-t border-charcoal/10 bg-white py-section lg:py-24" aria-label="Request a quote">
      <Container>
        <Reveal>
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
                <span aria-hidden="true" className="h-px w-8 bg-bronze" />
                {eyebrow}
              </p>
              <h2 className="mt-6 max-w-2xl font-display text-display-sm text-charcoal sm:text-display">{title}</h2>
              <p className="mt-6 max-w-prose font-sans text-[1.0625rem] leading-relaxed text-stone-600">{body}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-6 lg:justify-end">
              <ButtonLink to={primaryTo} variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                {primaryLabel}
              </ButtonLink>
              <ButtonLink to={secondaryTo} variant="outline" size="lg">
                {secondaryLabel}
              </ButtonLink>
              <ButtonLink
                to={defaultWhatsAppUrl()}
                external
                variant="outline"
                size="lg"
                icon={<WhatsApp className="h-4 w-4" />}
                ariaLabel="Chat with TOC Luxury Constructions on WhatsApp"
              >
                WhatsApp
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
