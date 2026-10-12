import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminProvider'
import { getAt, setAt, type Field } from './fields'
import { sectionSchemas } from './schema'
import { PAGE_FOR_SECTION } from './routes'

/**
 * Add something, from anywhere.
 * ---------------------------------------------------------------------------
 * Every repeatable part of the site (services, process stages, questions,
 * principles, nav links, footer sections, quoted reviews) is a list in the
 * content document, each with its own blank template. This menu walks the
 * schemas, finds every one of them, and offers them in a single list — press it,
 * pick what you want to add, and the new entry exists and is open for typing.
 *
 * Nothing here is a shortcut around the content model: it uses exactly the same
 * blank templates the inline "Add" buttons use, and the same autosave.
 */

type Addable = {
  key: string
  section: string
  sectionTitle: string
  path: string
  label: string
  count: number
}

/** Every list field in every section, including one level of nesting. */
const collect = (): Addable[] => {
  const found: Addable[] = []
  const walk = (section: string, sectionTitle: string, fields: Field[], prefix: string) => {
    for (const field of fields) {
      const path = prefix ? prefix + '.' + field.path : field.path
      if (field.kind === 'list') {
        found.push({ key: section + ':' + path, section, sectionTitle, path, label: field.addLabel, count: 0 })
        continue
      }
      if ('fields' in field && Array.isArray((field as { fields?: Field[] }).fields)) {
        walk(section, sectionTitle, (field as { fields: Field[] }).fields, path)
      }
    }
  }
  for (const schema of sectionSchemas) walk(schema.key, schema.title, schema.fields, '')
  return found
}

const ADDABLES = collect()

export function AddMenu() {
  const { content, update } = useAdmin()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const entries = useMemo(
    () =>
      ADDABLES.map((entry) => {
        const section = content ? (content as unknown as Record<string, unknown>)[entry.section] : undefined
        const value = section ? getAt(section, entry.path) : undefined
        return { ...entry, count: Array.isArray(value) ? value.length : 0 }
      }),
    [content],
  )

  const add = (entry: Addable) => {
    const section = content ? (content as unknown as Record<string, unknown>)[entry.section] : undefined
    const current = section ? getAt(section, entry.path) : undefined
    const list = Array.isArray(current) ? (current as unknown[]) : []
    const template = ADDABLES.length > 0 ? templateFor(entry) : undefined
    if (!template) return
    const next = [...list, template()]
    update(entry.section as never, (value) => setAt(value as never, entry.path, next) as never)

    const page = PAGE_FOR_SECTION[entry.section] ?? 'home'
    const query = new URLSearchParams({
      section: entry.section,
      field: entry.path,
      open: entry.path,
      row: String(list.length),
    })
    navigate('/admin/visual/' + page + '?' + query.toString())
    setOpen(false)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Addable[]>()
    for (const entry of entries) {
      const list = map.get(entry.sectionTitle) ?? []
      list.push(entry)
      map.set(entry.sectionTitle, list)
    }
    return Array.from(map.entries())
  }, [entries])

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        id="admin-add-menu"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 border border-charcoal bg-charcoal px-3 py-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-ivory transition-colors hover:bg-charcoal/90"
      >
        <span aria-hidden="true">+</span> Add
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Add something to the site"
          className="absolute right-0 z-40 mt-2 max-h-[70vh] w-[19rem] overflow-y-auto border border-charcoal/20 bg-white shadow-xl"
        >
          <div className="border-b border-charcoal/10 px-4 py-3">
            <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">Add</p>
            <p className="mt-1 font-sans text-[0.75rem] leading-relaxed text-stone-600">
              Creates the entry straight away, saves it, and opens it for you to fill in. New entries start hidden or as
              a draft where the site needs that.
            </p>
          </div>
          {grouped.map(([title, list]) => (
            <div key={title} className="border-b border-charcoal/10 px-2 py-2 last:border-b-0">
              <p className="px-2 py-1 font-sans text-[0.5625rem] uppercase tracking-eyebrow text-stone-400">{title}</p>
              {list.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  role="menuitem"
                  onClick={() => add(entry)}
                  className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left font-sans text-[0.8125rem] text-charcoal transition-colors hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
                >
                  <span>{entry.label}</span>
                  <span className="font-sans text-[0.625rem] text-stone-400">{entry.count} now</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** The blank template for a list path, pulled back off the schema it came from. */
const templateFor = (entry: Addable): (() => unknown) | undefined => {
  let found: (() => unknown) | undefined
  for (const schema of sectionSchemas) {
    if (schema.key !== entry.section) continue
    const walk = (fields: Field[], prefix: string) => {
      for (const field of fields) {
        const path = prefix ? prefix + '.' + field.path : field.path
        if (field.kind === 'list' && path === entry.path) {
          found = field.blank
          return
        }
        if ('fields' in field && Array.isArray((field as { fields?: Field[] }).fields)) {
          walk((field as { fields: Field[] }).fields, path)
        }
      }
    }
    walk(schema.fields, '')
  }
  return found
}
