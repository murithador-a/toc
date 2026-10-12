import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAdmin } from '../AdminProvider'
import { schemaFor } from '../schema'
import { setAt } from '../fields'
import { FieldGroup } from '../FieldRenderer'
import { Button, InlineNotice, useRelativeTime } from '../ui'

/**
 * The visual editor — the site itself, with the editor beside it.
 * ---------------------------------------------------------------------------
 * The large panel is the real website (the same code the visitor gets), loaded
 * with `?toc-preview=1`. Click anything on it and the matching field opens on the
 * left; type and the page changes as you type. Saving still happens in the
 * background exactly as it does everywhere else in the admin.
 */

type Device = 'desktop' | 'tablet' | 'mobile'

type PageDef = { key: string; label: string; path: string; sections: string[] }

const PAGES: PageDef[] = [
  { key: 'home', label: 'Home', path: '/', sections: ['home', 'about', 'services', 'process', 'projects', 'reviews', 'faqs', 'cta'] },
  { key: 'about', label: 'About', path: '/about', sections: ['about', 'process', 'reviews', 'cta'] },
  { key: 'services', label: 'Services', path: '/services', sections: ['services', 'process', 'faqs', 'cta'] },
  { key: 'projects', label: 'Projects', path: '/projects', sections: ['projects', 'cta'] },
  { key: 'contact', label: 'Contact', path: '/contact', sections: ['contact', 'company', 'faqs', 'forms'] },
  { key: 'consultation', label: 'Consultation', path: '/consultation', sections: ['consultation', 'company'] },
  { key: 'privacy', label: 'Privacy', path: '/privacy', sections: ['privacy'] },
]

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1440, tablet: 834, mobile: 390 }

const relativeLabel = (at: number): string => {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return seconds + ' s ago'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return minutes + ' min ago'
  return Math.round(minutes / 60) + ' h ago'
}

export function VisualEditor() {
  const { page: pageParam = 'home' } = useParams()
  const page = PAGES.find((entry) => entry.key === pageParam) ?? PAGES[0]
  const navigate = useNavigate()
  const { content, update, status, overall, savedAt, undo, redo, canUndo, canRedo } = useAdmin()

  const [searchParams] = useSearchParams()
  const requestedSection = searchParams.get('section')
  const requestedField = searchParams.get('field')
  const [section, setSection] = useState(requestedSection ?? page.sections[0])
  const [field, setField] = useState<string | null>(requestedField)
  const [hoverLabel, setHoverLabel] = useState('')
  const [device, setDevice] = useState<Device>('desktop')
  const [ready, setReady] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [pageEditing, setPageEditing] = useState(false)
  /** True while the text is being typed on the page — nothing is pushed back at it. */
  const suppressPush = useRef(false)

  const frameRef = useRef<HTMLIFrameElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const savedLabel = useRelativeTime(savedAt)

  useEffect(() => {
    if (!page.sections.includes(section)) setSection(page.sections[0])
  }, [page, section])

  const pushContent = useCallback(() => {
    const target = frameRef.current?.contentWindow
    if (!target || !content) return
    target.postMessage({ type: 'toc:preview:content', content }, window.location.origin)
  }, [content])

  /**
   * A change typed straight into the page. It goes into the same draft as any
   * other edit — the page is not told about it until the typing stops, or the
   * re-render would take the caret away mid-word.
   */
  const applyPageEdit = useCallback(
    (path: string, text: string) => {
      const parts = path.split('.')
      const targetSection = parts[0]
      const within = parts.slice(1).join('.')
      if (!targetSection || !within) return
      update(targetSection as never, (current) => setAt(current as never, within, text) as never)
    },
    [update],
  )

  /* -------------------------------------------------- the page, talking back */

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; field?: string; label?: string; text?: string } | null
      if (!data || typeof data !== 'object') return

      if (data.type === 'toc:preview:edit:begin') {
        suppressPush.current = true
        setPageEditing(true)
        return
      }
      if (data.type === 'toc:preview:edit:end') {
        suppressPush.current = false
        setPageEditing(false)
        // No push here on purpose: the draft may just have been reverted by Esc,
        // and this closure still holds the pre-revert content. The effect below
        // pushes as soon as the draft actually changes.
        return
      }
      if (data.type === 'toc:preview:edit' && typeof data.field === 'string' && typeof data.text === 'string') {
        applyPageEdit(data.field, data.text)
        return
      }

      if (data.type === 'toc:preview:ready') {
        setReady(true)
        pushContent()
        return
      }
      if (data.type === 'toc:preview:hover') {
        setHoverLabel(data.label ?? '')
        return
      }
      if (data.type === 'toc:preview:select' && typeof data.field === 'string') {
        if (data.field.startsWith('project:')) {
          const slug = data.field.slice('project:'.length)
          if (slug) navigate('/admin/projects/' + slug)
          return
        }
        const path = data.field.replace(/^field:/, '')
        const parts = path.split('.')
        const nextSection = parts[0]
        if (!nextSection) return
        setSection(nextSection)
        setField(parts.slice(1).join('.') || null)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, pushContent])

  /* ------------------------------------------------ the editor, talking back */

  useEffect(() => {
    if (!ready || suppressPush.current) return undefined
    const timer = window.setTimeout(pushContent, 80)
    return () => window.clearTimeout(timer)
  }, [content, ready, pushContent])

  useEffect(() => {
    const target = frameRef.current?.contentWindow
    if (!target || !ready) return
    target.postMessage({ type: 'toc:preview:highlight', field: field ? section + '.' + field : null }, window.location.origin)
  }, [ready, section, field])

  /** Bring the field the visitor clicked into view in the panel. */
  useEffect(() => {
    if (!field) return undefined
    const node = panelRef.current?.querySelector('[data-field="' + field + '"]')
    if (!node) return undefined
    node.scrollIntoView({ block: 'center', behavior: 'smooth' })
    node.classList.add('ring-2', 'ring-bronze', 'ring-offset-2')
    const timer = window.setTimeout(() => node.classList.remove('ring-2', 'ring-bronze', 'ring-offset-2'), 1600)
    return () => window.clearTimeout(timer)
  }, [field, section])

  const schema = schemaFor(section)
  const value = useMemo(() => (content ? (content as unknown as Record<string, unknown>)[section] : undefined), [content, section])

  const changePage = (next: PageDef) => {
    navigate('/admin/visual/' + next.key)
    setReady(false)
    setField(null)
    setHoverLabel('')
    setSection(next.sections[0])
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 border border-charcoal/12 bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {PAGES.map((entry) => (
            <button
              key={entry.key}
              type="button"
              data-toc-page-tab={entry.key}
              onClick={() => changePage(entry)}
              className={
                'px-2.5 py-1.5 font-sans text-[0.75rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze ' +
                (entry.key === page.key ? 'bg-charcoal text-ivory' : 'text-stone-600 hover:bg-ivory hover:text-charcoal')
              }
            >
              {entry.label}
            </button>
          ))}
        </div>

        <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-charcoal/15 sm:block" />

        <div className="flex items-center gap-1">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map((entry) => (
            <button
              key={entry}
              type="button"
              data-toc-device={entry}
              onClick={() => setDevice(entry)}
              aria-pressed={device === entry}
              className={
                'px-2 py-1.5 font-sans text-[0.6875rem] uppercase tracking-eyebrow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze ' +
                (device === entry ? 'bg-bronze/15 text-charcoal' : 'text-stone-500 hover:text-charcoal')
              }
            >
              {entry}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button tone="quiet" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            Undo
          </Button>
          <Button tone="quiet" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            Redo
          </Button>
          <span className="hidden font-sans text-[0.75rem] text-stone-500 sm:inline" aria-live="polite">
            {overall === 'saving' || overall === 'pending' ? 'Saving…' : overall === 'error' ? 'Could not save' : 'Saved ' + savedLabel}
          </span>
          <Button tone="outline" className="lg:hidden" onClick={() => setShowPanel((current) => !current)}>
            {showPanel ? 'Hide fields' : 'Show fields'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {showPanel ? (
          <div className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[24rem] lg:self-start">
            <div className="border border-charcoal/12 bg-white">
              <div className="border-b border-charcoal/10 px-4 py-3">
                <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
                  {pageEditing ? 'Typing on the page' : 'Editing'}
                </p>
                <p className="mt-1 font-sans text-[0.8125rem] text-stone-600">
                  {pageEditing
                    ? 'Type over the text directly. Enter or a click elsewhere keeps it; Esc puts the original wording back.'
                    : hoverLabel || 'Click anything in the page to edit it.'}
                </p>
              </div>

              <div data-toc-section-tabs className="flex flex-wrap gap-1 border-b border-charcoal/10 p-2">
                {page.sections.map((key) => {
                  const entry = schemaFor(key)
                  const active = key === section
                  return (
                    <button
                      key={key}
                      type="button"
                      data-toc-section-tab={key}
                      onClick={() => {
                        setSection(key)
                        setField(null)
                      }}
                      className={
                        'px-2.5 py-1.5 font-sans text-[0.6875rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze ' +
                        (active ? 'bg-bronze/15 text-charcoal' : 'text-stone-600 hover:bg-ivory')
                      }
                    >
                      {entry?.title ?? key}
                    </button>
                  )
                })}
              </div>

              <div ref={panelRef} className="max-h-[60vh] overflow-y-auto p-4 lg:max-h-[calc(100vh-17rem)]">
                {schema ? (
                  <>
                    <h2 className="font-display text-[1.25rem] leading-tight text-charcoal">{schema.title}</h2>
                    <p className="mt-1 font-sans text-[0.75rem] leading-relaxed text-stone-500">{schema.description}</p>
                    {schema.hint ? (
                      <div className="mt-3">
                        <InlineNotice>{schema.hint}</InlineNotice>
                      </div>
                    ) : null}
                    <div className="mt-5">
                      <FieldGroup
                        fields={schema.fields}
                        value={value}
                        onChange={(next) => update(section as never, () => next as never)}
                        columns={1}
                      />
                    </div>
                  </>
                ) : (
                  <p className="font-sans text-[0.8125rem] text-stone-600">Nothing to edit in this section.</p>
                )}
              </div>

              <p className="border-t border-charcoal/10 px-4 py-2.5 font-sans text-[0.6875rem] text-stone-500">
                {status[section] === 'saved' ? 'Saved ' + relativeLabel(Date.now()) : 'Changes save as you type'}
              </p>
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-b-0 border-charcoal/12 bg-ivory px-3 py-2">
            <p className="truncate font-sans text-[0.75rem] text-stone-600">
              {page.path} <span className="text-stone-400">— the real page, updating live</span>
            </p>
            <a
              href={page.path}
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-bronze hover:text-charcoal"
            >
              Open in a tab
            </a>
          </div>
          <div className="border border-charcoal/12 bg-stone-100 p-0 sm:p-3">
            <div className="mx-auto bg-white" style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}>
              <iframe
                key={page.path}
                ref={frameRef}
                title={'Preview of ' + page.label}
                src={page.path + '?toc-preview=1'}
                className="block h-[70vh] w-full border-0 bg-ivory lg:h-[calc(100vh-14rem)]"
                onLoad={() => setReady(true)}
              />
            </div>
          </div>
          <p className="mt-2 font-sans text-[0.6875rem] text-stone-500">
            Click text to type over it directly — Enter keeps it, Esc puts the original wording back. Headings,
            paragraphs and captions are all editable this way; everything else opens in the panel. Hold Ctrl (or Command) to follow a link, and project
            cards open their own editor.
          </p>
        </div>
      </div>
    </div>
  )
}
