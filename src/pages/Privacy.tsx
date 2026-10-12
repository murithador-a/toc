import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/site/PageHero'
import { Container } from '../components/ui/Container'
import { Reveal } from '../components/ui/Reveal'
import { Notice } from '../components/ui/Notice'
import { useContent } from '../content/context'
import { configured } from '../lib/integrations'

export default function Privacy() {
  const { privacy, seo, company } = useContent()
  const base = seo.siteUrl.replace(/\/$/, '')

  // Stated from the live configuration rather than edited copy, so the page can
  // never describe form handling that differs from what the site actually does.
  const handling = configured.inquiry || configured.consultation
    ? {
        title: 'Forms that reach the company',
        body: `When you submit a form, your details are delivered to ${company.legalName} and stored securely so the company can respond. They are used to answer your enquiry and to manage any resulting project or quotation, and are visible only to the company. The website does not send them anywhere else.`,
      }
    : {
        title: 'Nothing is transmitted',
        body: 'The inquiry and consultation forms on this deployment are not connected to a delivery service. Nothing you type into them is transmitted or stored by this website — your details are prepared as a WhatsApp message for you to review and send yourself.',
      }

  const uploads = configured.uploads
    ? 'Attachments are accepted as PDF or image files, limited by type and size in the browser and revalidated on the server. Please upload the minimum necessary.'
    : 'File upload is disabled on this deployment because no secure storage endpoint is configured. Send drawings or photographs through WhatsApp instead, once you are comfortable sharing them.'

  return (
    <>
      <Seo
        title={`Privacy Policy | ${company.legalName}`}
        description={`How ${company.legalName} handles the information you send through this website.`}
        path="/privacy"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Privacy policy',
          url: `${base}/privacy`,
        }}
      />

      <PageHero
        eyebrow={privacy.eyebrow}
        breadcrumb={privacy.breadcrumb}
        title={
          <>
            {privacy.heading}
            {privacy.headingAccent ? <span className="italic text-bronze">{privacy.headingAccent}</span> : null}
          </>
        }
        intro={privacy.intro ? <p>{privacy.intro}</p> : undefined}
      />

      <section className="bg-white py-section lg:py-section-lg">
        <Container>
          <div className="max-w-prose space-y-10 font-sans text-[1rem] leading-relaxed text-stone-600">
            <Reveal>
              <div className="border border-charcoal/10 bg-ivory p-6">
                <h2 className="font-display text-[1.5rem] text-charcoal">{handling.title}</h2>
                <p className="mt-4">{handling.body}</p>
                <p className="mt-4">{uploads}</p>
              </div>
            </Reveal>

            {privacy.sections.map((section) => (
              <Reveal key={section.heading}>
                <div>
                  <h2 className="font-display text-[1.75rem] text-charcoal">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="mt-5">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Reveal>
            ))}

            {privacy.note ? (
              <Reveal>
                <Notice label="Client note —">{privacy.note}</Notice>
              </Reveal>
            ) : null}
          </div>
        </Container>
      </section>
    </>
  )
}
