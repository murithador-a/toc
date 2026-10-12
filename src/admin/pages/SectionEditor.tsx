import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAdmin } from '../AdminProvider'
import { schemaFor } from '../schema'
import { FieldGroup } from '../FieldRenderer'
import { Badge, Button, Card, InlineNotice, TextArea } from '../ui'
import { SectionPreviewLink } from './SectionPreviewLink'
import { Link } from 'react-router-dom'
import { visualLink } from '../routes'

const previewFor: Record<string, { to: string; label: string }> = {
  company: { to: '/contact', label: 'Contact page' },
  menu: { to: '/', label: 'Any page' },
  home: { to: '/', label: 'Home page' },
  about: { to: '/about', label: 'About page' },
  services: { to: '/services', label: 'Services page' },
  process: { to: '/services', label: 'Services page' },
  reviews: { to: '/', label: 'Home page' },
  faqs: { to: '/contact', label: 'Contact page' },
  contact: { to: '/contact', label: 'Contact page' },
  consultation: { to: '/consultation', label: 'Consultation page' },
  cta: { to: '/about', label: 'About page' },
  privacy: { to: '/privacy', label: 'Privacy page' },
  footer: { to: '/', label: 'Any page' },
  forms: { to: '/contact#inquiry', label: 'Quote form' },
  seo: { to: '/', label: 'Home page' },
  meta: { to: '/', label: '—' },
}

/**
 * One screen per content section, generated from its schema.
 *
 * The raw JSON panel underneath is the guarantee behind “edit anything”: if a
 * value has no friendly control, it can still be changed here, and it is
 * validated by the server before it is written.
 */
export function SectionEditor() {
  const { section = '' } = useParams()
  const { content, update, replace, status, restoreLocal } = useAdmin()
  const schema = schemaFor(section)
  const [raw, setRaw] = useState<string | null>(null)
  const [rawProblem, setRawProblem] = useState<string | null>(null)

  if (!schema || !content) {
    return (
      <Card title="Unknown section">
        <p className="font-sans text-[0.875rem] text-stone-600">
          There is no editable section called “{section}”. Choose one from the menu.
        </p>
      </Card>
    )
  }

  const value = (content as Record<string, unknown>)[section]
  const sectionStatus = status[section] ?? 'idle'
  const preview = previewFor[section]

  const applyRaw = () => {
    if (raw === null) return
    try {
      replace(section, JSON.parse(raw) as never)
      setRawProblem(null)
    } catch (cause) {
      setRawProblem(cause instanceof Error ? cause.message : 'That is not valid JSON.')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.25rem] leading-tight text-charcoal">{schema.title}</h1>
          <p className="mt-2 max-w-2xl font-sans text-[0.9375rem] leading-relaxed text-stone-600">{schema.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {sectionStatus === 'saved' ? <Badge tone="muted">Saved</Badge> : null}
          {sectionStatus === 'pending' || sectionStatus === 'saving' ? <Badge tone="draft">Saving</Badge> : null}
          {sectionStatus === 'error' ? <Badge tone="placeholder">Not saved</Badge> : null}
          {preview ? <SectionPreviewLink to={preview.to} label={preview.label} /> : null}
          <Link
            to={visualLink(section)}
            className="border border-charcoal/20 px-3 py-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-bronze hover:text-bronze"
          >
            Edit visually
          </Link>
        </div>
      </header>

      {schema.hint ? <InlineNotice>{schema.hint}</InlineNotice> : null}

      <Card>
        <FieldGroup
          fields={schema.fields}
          value={value}
          onChange={(next) => update(section as never, () => next as never)}
          columns={2}
        />
      </Card>

      <Card
        title="Advanced: edit this section as data"
        description="For values without a control above. The server validates the whole document before saving, so a mistake here is refused rather than published."
      >
        {raw === null ? (
          <Button onClick={() => setRaw(JSON.stringify(value, null, 2))}>Show the raw JSON</Button>
        ) : (
          <div className="space-y-4">
            {rawProblem ? <InlineNotice tone="error">{rawProblem}</InlineNotice> : null}
            <TextArea value={raw} onChange={setRaw} rows={22} />
            <div className="flex flex-wrap gap-3">
              <Button tone="primary" onClick={applyRaw}>
                Apply changes
              </Button>
              <Button onClick={() => setRaw(JSON.stringify(value, null, 2))}>Reset</Button>
              <Button
                tone="quiet"
                onClick={() => {
                  setRaw(null)
                  setRawProblem(null)
                  restoreLocal()
                }}
              >
                Discard unsaved edits to this section
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
