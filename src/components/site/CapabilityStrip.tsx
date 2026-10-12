import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { useContent } from '../../content/context'

/** Quiet statement of what the company does — no statistics, no claims. */
export function CapabilityStrip() {
  const { services, home } = useContent()
  const items = services.items.filter((service) => service.published)

  if (!home.capability.enabled || items.length === 0) return null

  return (
    <section aria-label="What we do" className="border-b border-charcoal/10 bg-ivory">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
          {items.map((service, index) => (
            <Link
              key={service.slug}
              to={`/services#${service.slug}`}
              className={`group flex flex-col gap-3 px-0 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-4 lg:px-8 ${
                index === 0 ? 'lg:pl-0' : 'lg:border-l lg:border-charcoal/10'
              }`}
            >
              <span className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-bronze">{service.index}</span>
              <span className="font-display text-[1.35rem] leading-snug text-charcoal transition-colors group-hover:text-bronze">
                {service.title}
              </span>
              <span className="font-sans text-[0.8125rem] leading-relaxed text-stone-600">{service.tagline}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
