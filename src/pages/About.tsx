import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/site/PageHero'
import { Container } from '../components/ui/Container'
import { Reveal } from '../components/ui/Reveal'
import { Notice } from '../components/ui/Notice'
import { PlaceholderFrame } from '../components/ui/PlaceholderFrame'
import { Picture } from '../components/ui/Picture'
import { CtaBand } from '../components/site/CtaBand'
import { useContent } from '../content/context'

export default function About() {
  const { about, seo, company, cta } = useContent()
  const base = seo.siteUrl.replace(/\/$/, '')

  return (
    <>
      <Seo
        title={`About ${company.legalName} | Construction Company, Osogbo`}
        description={`${company.legalName} is a construction company at ${company.addressFull} — built on planning, defined by quality.`}
        path="/about"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: `About ${company.legalName}`,
          url: `${base}/about`,
          about: { '@id': `${base}/#organisation` },
        }}
      />

      <PageHero
        eyebrow={about.hero.eyebrow}
        breadcrumb={about.hero.breadcrumb}
        title={
          <>
            {about.hero.heading}
            {about.hero.headingAccent ? <span className="italic text-bronze">{about.hero.headingAccent}</span> : null}
          </>
        }
        intro={about.hero.intro ? <p>{about.hero.intro}</p> : undefined}
      />

      <section className="bg-white py-section lg:py-section-lg" aria-labelledby="about-intro">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              <h2 id="about-intro" className="font-display text-display-sm text-charcoal sm:text-display">
                {about.sectionHeading}
                {about.sectionHeadingAccent ? (
                  <span className="italic text-bronze">{about.sectionHeadingAccent}</span>
                ) : null}
              </h2>
              <div className="mt-7 max-w-prose space-y-5 font-sans text-[1.0625rem] leading-relaxed text-stone-600">
                {about.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <Picture image={about.imageSmall} sizes="(min-width: 640px) 30vw, 90vw" ratio="aspect-[4/3]" />
                <Picture image={about.imageLarge} sizes="(min-width: 640px) 30vw, 90vw" ratio="aspect-[4/3]" />
              </div>
              {about.imageNote ? (
                <p className="mt-3 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-400">
                  {about.imageNote}
                </p>
              ) : null}
            </Reveal>

            <div className="lg:col-span-6 lg:pl-8">
              <Reveal delay={80}>
                {about.principles.length > 0 ? (
                  <>
                    <h3 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal">
                      {about.principlesHeading}
                    </h3>
                    <ol className="mt-6 space-y-8">
                      {about.principles.map((principle, index) => (
                        <li key={principle.title} className="border-t border-charcoal/10 pt-5">
                          <div className="flex items-baseline gap-4">
                            <span className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-bronze">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <h4 className="font-display text-[1.5rem] text-charcoal">{principle.title}</h4>
                          </div>
                          <p className="mt-3 max-w-prose pl-9 font-sans text-[0.9375rem] leading-relaxed text-stone-600">
                            {principle.body}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : null}
              </Reveal>

              <Reveal delay={120} className="mt-12">
                <div className="grid gap-8 sm:grid-cols-2">
                  {[
                    { label: about.missionLabel, body: about.mission },
                    { label: about.visionLabel, body: about.vision },
                  ]
                    .filter((entry) => entry.label || entry.body)
                    .map((entry) => (
                      <div key={entry.label} className="border border-charcoal/10 bg-ivory p-6">
                        <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
                          {entry.label}
                        </p>
                        <p className="mt-3 font-sans text-[0.9375rem] leading-relaxed text-stone-600">{entry.body}</p>
                      </div>
                    ))}
                </div>

                {about.photographyLabel ? (
                  <PlaceholderFrame
                    label={about.photographyLabel}
                    caption={about.photographyCaption}
                    aspect="aspect-[16/9]"
                    className="mt-8"
                  />
                ) : null}

                {about.note ? (
                  <Notice className="mt-8" label="Awaiting confirmation from TOC:">
                    {about.note}
                  </Notice>
                ) : null}
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <CtaBand band={cta.about} />
    </>
  )
}
