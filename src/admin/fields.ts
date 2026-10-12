/**
 * Field descriptors.
 * ---------------------------------------------------------------------------
 * Every admin screen is generated from a small declarative description of the
 * section it edits. That keeps the editor, the labels and the help text in one
 * place, and means a new content field becomes editable by adding a line here
 * rather than by writing another form.
 *
 * Paths use dot/bracket notation into the section object: `hero.headline`,
 * `items[0].scope`, `rating.value`.
 */

export type FieldBase = {
  path: string
  label: string
  help?: string
  /** Long-form fields get more room in the layout */
  wide?: boolean
}

export type Field =
  | (FieldBase & { kind: 'text'; placeholder?: string; maxLength?: number })
  | (FieldBase & { kind: 'textarea'; rows?: number; maxLength?: number })
  /** string[] edited as one block of prose — blank line separates paragraphs */
  | (FieldBase & { kind: 'paragraphs'; rows?: number })
  /** string[] edited one item per line */
  | (FieldBase & { kind: 'lines'; rows?: number; placeholder?: string })
  | (FieldBase & { kind: 'number'; min?: number; max?: number; step?: number })
  | (FieldBase & { kind: 'boolean' })
  | (FieldBase & { kind: 'image' })
  | (FieldBase & {
      kind: 'list'
      itemTitle: string
      /** Fields shown on the collapsed row of each item */
      fields: Field[]
      /** New item template — a function so every insertion is a fresh object */
      blank: () => unknown
      addLabel: string
      /** Longer lists (projects) render as a table instead of stacked cards */
      compact?: boolean
    })

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

const TOKEN = /\[([^\]]+)\]|\.?([^.[\]]+)/g

export const parsePath = (path: string): string[] => {
  const parts: string[] = []
  let match: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((match = TOKEN.exec(path)) !== null) {
    const part = match[1] ?? match[2]
    if (part !== undefined && part !== '') parts.push(part)
  }
  return parts
}

export const getAt = (source: unknown, path: string): unknown => {
  let cursor: unknown = source
  for (const part of parsePath(path)) {
    if (cursor === null || cursor === undefined) return undefined
    cursor = (cursor as Record<string, unknown>)[part]
  }
  return cursor
}

/**
 * Immutable write. Copies only the objects along the path, so React state
 * updates stay cheap even for the large projects section.
 */
export const setAt = <T,>(source: T, path: string, value: unknown): T => {
  const parts = parsePath(path)
  if (parts.length === 0) return value as T

  const root: unknown = Array.isArray(source) ? [...(source as unknown[])] : { ...(source as object) }
  let cursor = root as Record<string, unknown>

  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]
    const child = cursor[key]
    const copy: unknown = Array.isArray(child) ? [...child] : { ...(child as object | undefined) }
    cursor[key] = copy
    cursor = copy as Record<string, unknown>
  }

  cursor[parts[parts.length - 1]] = value
  return root as T
}

/** Human-readable byte size, for the media library. */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Turn a title into a URL slug, matching the way project page URLs are built. */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60)

/**
 * Copy of a list item, made safe to insert next to its original: the visible name
 * gains " (copy)" and a `slug` is given a free value so two entries can never
 * claim the same web address.
 */
export const duplicateListItem = <T,>(item: T, siblings: T[]): T => {
  const copy = JSON.parse(JSON.stringify(item)) as T
  if (!copy || typeof copy !== 'object') return copy
  const record = copy as Record<string, unknown>

  for (const key of ['title', 'question', 'label', 'name', 'text']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      record[key] = value + ' (copy)'
      break
    }
  }

  if (typeof record.slug === 'string' && record.slug.trim().length > 0) {
    const taken = new Set(
      siblings.map((entry) =>
        entry && typeof entry === 'object' ? String((entry as Record<string, unknown>).slug ?? '') : '',
      ),
    )
    let candidate = record.slug + '-copy'
    let counter = 2
    while (taken.has(candidate)) candidate = record.slug + '-copy-' + counter++
    record.slug = candidate
  }

  if (record.status === 'published') record.status = 'draft'
  return copy
}

export type SectionSchema = {
  /** Top-level key in content/site.json */
  key: string
  title: string
  description: string
  fields: Field[]
  /** Extra things the generic screen cannot express */
  hint?: string
}

export type { Json }
