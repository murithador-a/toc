import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminProvider'
import { sectionSchemas } from './schema'
import { PAGE_FOR_SECTION } from './routes'
import { interpolateContent } from '../content/interpolate'

/**
 * Quick find (Ctrl+K).
 * ---------------------------------------------------------------------------
 * Searches every word the site can show — headings, paragraphs, services,
 * projects, questions, footer copy — and jumps straight to the field that holds
 * it, opening the visual editor on the right page with the field selected.
 *
 * Also doubles as a launcher: the quick actions are listed before the content so
 * "new project" is three keystrokes away.
 */

type ActionHit = { kind: 'action'; id: string; title: string; hint: string; to: string }
type ContentHit = {
  kind: 'content'
  id: string
  title: string
  hint: string
  excerpt: string
  page: string
  section: string
  field: string
}
type Hit = ActionHit | ContentHit

const prettify = (path: string): string =>
  path
    .replace(/\[(\d+)\]/g, ' #$1')
    .split('.')
    .filter(Boolean)
    .map((part) => part.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()))
    .join(' › ')

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { content } = useAdmin()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      window.setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])

  const actions = useMemo(
    () => [
      { id: 'dashboard', title: 'Dashboard', hint: 'Overview of the whole site', to: '/admin' },
      { id: 'visual', title: 'Visual editor', hint: 'Edit the site by clicking it', to: '/admin/visual' },
      { id: 'new-project', title: 'Add a project', hint: 'Create a new project entry', to: '/admin/projects/new' },
      { id: 'projects', title: 'Projects', hint: 'Reorder, publish, edit', to: '/admin/projects' },
      { id: 'media', title: 'Images', hint: 'Everything uploaded so far', to: '/admin/media' },
      { id: 'inbox', title: 'Enquiries', hint: 'Quote requests and consultations', to: '/admin/inbox' },
      { id: 'settings', title: 'Settings & backups', hint: 'Password, backups, safety', to: '/admin/settings' },
    ],
    [],
  )

  const contentIndex = useMemo(() => {
    if (!content) return [] as ContentHit[]
    const pretty = interpolateContent(content)
    const hits: ContentHit[] = []
    const walk = (raw: unknown, nice: unknown, path: string[]): void => {
      if (typeof raw === 'string') {
        const value = raw.trim()
        if (value.length < 3 || /^https?:|^\/|^\{\{/.test(value)) return
        const shown = typeof nice === 'string' && nice.trim().length > 0 ? nice.trim() : value
        const section = path[0]
        if (!section || path.length < 2) return
        const schema = sectionSchemas.find((entry) => entry.key === section)
        const field = path.slice(1).join('.')
        hits.push({
          kind: 'content',
          id: `${section}:${field}`,
          title: schema ? `${schema.title} › ${prettify(field)}` : `${section} › ${prettify(field)}`,
          hint: section,
          excerpt: shown.length > 150 ? `${shown.slice(0, 150)}…` : shown,
          page: PAGE_FOR_SECTION[section] ?? 'home',
          section,
          field,
        })
        return
      }
      if (Array.isArray(raw)) {
        raw.forEach((item, index) => walk(item, Array.isArray(nice) ? nice[index] : undefined, [...path, `[${index}]`]))
        return
      }
      if (raw && typeof raw === 'object') {
        for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
          walk(value, nice && typeof nice === 'object' ? (nice as Record<string, unknown>)[key] : undefined, [...path, key])
        }
      }
    }
    walk(content, pretty, [])
    return hits
  }, [content])

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    const actionHits: ActionHit[] = actions.map((action) => ({
      kind: 'action',
      id: action.id,
      title: action.title,
      hint: action.hint,
      to: action.to,
    }))
    if (term.length === 0) {
      return [...actionHits, ...contentIndex.slice(0, 8)]
    }
    const matchedActions = actionHits.filter((hit) => (hit.title + ' ' + hit.hint).toLowerCase().includes(term))
    const matchedContent = contentIndex
      .filter((hit) => (hit.title + ' ' + hit.excerpt).toLowerCase().includes(term))
      .slice(0, 40)
    return [...matchedActions, ...matchedContent]
  }, [actions, contentIndex, query])

  useEffect(() => {
    setCursor(0)
  }, [query])

  const go = (hit: Hit) => {
    if (hit.kind === 'action') {
      navigate(hit.to)
    } else {
      navigate(`/admin/visual/${hit.page}?section=${hit.section}&field=${encodeURIComponent(hit.field)}`)
    }
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((value) => Math.min(value + 1, results.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((value) => Math.max(value - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const hit = results[cursor]
      if (hit) go(hit)
    }
  }

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-charcoal/40 px-4 pt-[10vh]" onKeyDown={onKeyDown}>
      <button type="button" aria-label="Close search" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Search the site" className="relative w-full max-w-2xl border border-charcoal/20 bg-white shadow-xl">
        <div className="border-b border-charcoal/10 px-4 py-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search every word on the site, or type a command…"
            className="w-full border-0 bg-transparent font-sans text-[0.9375rem] text-charcoal outline-none placeholder:text-stone-400"
            aria-label="Search content"
          />
        </div>
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-6 font-sans text-[0.8125rem] text-stone-500">
              Nothing on the site matches “{query}”.
            </p>
          ) : (
            results.map((hit, index) => (
              <button
                key={`${hit.kind}-${hit.id}`}
                type="button"
                data-active={index === cursor}
                onMouseEnter={() => setCursor(index)}
                onClick={() => go(hit)}
                className={`flex w-full flex-col gap-1 border-b border-charcoal/5 px-4 py-3 text-left transition-colors ${
                  index === cursor ? 'bg-ivory' : 'bg-white'
                }`}
              >
                <span className="font-sans text-[0.8125rem] font-semibold text-charcoal">
                  {hit.title}
                  {hit.kind === 'action' ? (
                    <span className="ml-2 font-sans text-[0.625rem] uppercase tracking-eyebrow text-bronze">Go</span>
                  ) : null}
                </span>
                <span className="font-sans text-[0.75rem] text-stone-500">
                  {hit.kind === 'content' ? hit.excerpt : hit.hint}
                </span>
              </button>
            ))
          )}
        </div>
        <p className="border-t border-charcoal/10 px-4 py-2 font-sans text-[0.6875rem] text-stone-400">
          ↑ ↓ to move · Enter to open · Esc to close
        </p>
      </div>
    </div>
  )
}
