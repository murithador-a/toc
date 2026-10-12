import type { SiteContent } from './types'
import { interpolateContent } from './interpolate'

/**
 * Preview bridge — the wire between the admin's visual editor and the real site.
 * ---------------------------------------------------------------------------
 * The admin shows the actual website in an iframe (the same code the visitor
 * gets, `?toc-preview=1` tells it to listen) and edits it by clicking on things.
 *
 * Nothing here runs for an ordinary visitor: the whole module is inert unless the
 * page was opened with the preview flag, and every message is checked against our
 * own origin before it is trusted.
 *
 * Two directions:
 *   site → admin   "the visitor clicked this" / "this is what is under the cursor"
 *   admin → site   "here is the current draft" / "highlight this field"
 */

export const PREVIEW_QUERY = 'toc-preview'

export const isPreviewFrame = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).get(PREVIEW_QUERY) !== null
  } catch {
    return false
  }
}

export type PreviewMessage =
  | { type: 'toc:preview:ready' }
  | { type: 'toc:preview:select'; field: string; label: string }
  | { type: 'toc:preview:hover'; field: string | null; label: string }
  | { type: 'toc:preview:content'; content: SiteContent }
  | { type: 'toc:preview:highlight'; field: string | null }
  /** Typed straight into the page: the element is being edited in place */
  | { type: 'toc:preview:edit'; field: string; text: string }
  | { type: 'toc:preview:edit:begin'; field: string }
  | { type: 'toc:preview:edit:end'; field: string }

const post = (message: PreviewMessage): void => {
  if (window.parent === window) return
  window.parent.postMessage(message, window.location.origin)
}

/* ------------------------------------------------------------- field index */

type Entry = { path: string; section: string; text: string; kind: 'text' | 'image'; value: string }

const normalise = (value: string): string => value.replace(/\s+/g, ' ').trim()

const isImageLike = (key: string, value: string): boolean =>
  /(^|\.)(src|ogImage|osmind|image)$/i.test(key) || /\.(jpe?g|png|webp|avif|svg)$/i.test(value)

/**
 * Every editable string in the document, keyed by its admin path
 * (`home.hero.headline`, `services.items[0].title`). Both the raw value and the
 * interpolated one are indexed, because the DOM shows the latter.
 */
export const buildFieldIndex = (content: SiteContent): Entry[] => {
  const interpolated = interpolateContent(content)
  const entries: Entry[] = []

  const walk = (raw: unknown, pretty: unknown, path: string[]): void => {
    if (typeof raw === 'string') {
      const key = path[path.length - 1] ?? ''
      const rawText = normalise(raw)
      const prettyText = typeof pretty === 'string' ? normalise(pretty) : rawText
      if (rawText.length === 0 && prettyText.length === 0) return
      const isImage = isImageLike(key, rawText)
      entries.push({
        path: path.join('.'),
        section: path[0] ?? '',
        text: prettyText || rawText,
        kind: isImage ? 'image' : 'text',
        value: raw,
      })
      if (prettyText && prettyText !== rawText) {
        entries.push({ path: path.join('.'), section: path[0] ?? '', text: rawText, kind: isImage ? 'image' : 'text', value: raw })
      }
      return
    }
    if (Array.isArray(raw)) {
      raw.forEach((item, index) => {
        const prettyItem = Array.isArray(pretty) ? pretty[index] : undefined
        walk(item, prettyItem, [...path, `[${index}]`])
      })
      return
    }
    if (raw && typeof raw === 'object') {
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        const prettyValue = pretty && typeof pretty === 'object' ? (pretty as Record<string, unknown>)[key] : undefined
        walk(value, prettyValue, [...path, key])
      }
    }
  }

  walk(content, interpolated, [])
  return entries.filter((entry) => entry.section !== '' && entry.path.length > 2)
}

const pathFor = (entry: Entry): string => entry.path.replace(/\.\[/g, '[')

/**
 * A field path without its section prefix.
 *
 * Entries built from the content document carry the whole path
 * (`home.hero.headline`); the editor panel expects the part within the section
 * (`hero.headline`). Without this the click lands on the right section but the
 * panel never scrolls to the field.
 */
const relativePath = (entry: Entry): string =>
  entry.path.startsWith(entry.section + '.') ? entry.path.slice(entry.section.length + 1) : entry.path

/** The `field:<section>.<path>` form both ends agree on. */
const messagePath = (entry: Entry): string => `${entry.section}.${relativePath(entry)}`

/** Candidates whose text matches what the visitor can see, best first. */
const matchByText = (entries: Entry[], text: string): Entry | null => {
  const target = normalise(text)
  if (target.length < 3 || target.length > 400) return null
  const exact = entries.filter((entry) => entry.kind === 'text' && entry.text === target)
  if (exact.length > 0) return exact.sort((a, b) => a.path.length - b.path.length)[0]
  const contained = entries
    .filter((entry) => entry.kind === 'text' && entry.text.includes(target))
    .sort((a, b) => a.text.length - b.text.length)
  if (contained.length > 0) return contained[0]
  const overlapping = entries
    .filter((entry) => entry.kind === 'text' && target.includes(entry.text) && entry.text.length >= 4)
    .sort((a, b) => b.text.length - a.text.length)
  return overlapping[0] ?? null
}

const matchByImage = (entries: Entry[], src: string): Entry | null => {
  let path = src
  try {
    path = new URL(src, window.location.href).pathname
  } catch {
    /* keep the raw value */
  }
  const found = entries.find((entry) => entry.kind === 'image' && (entry.value === path || entry.value === src || path.endsWith(entry.value)))
  return found ?? null
}

const describe = (entry: Entry): string => {
  const leaf = entry.path.split('.').slice(-2).join(' · ').replace(/\[\d+\]/g, '')
  return `${entry.section} — ${leaf}`
}

/* --------------------------------------------------------------- selection */

let index: Entry[] = []

export const setPreviewContent = (content: SiteContent): void => {
  index = buildFieldIndex(content)
}

/** What is this DOM node? An explicit `data-field`, or the text it is showing. */
export const resolveField = (node: Element | null): Entry | null => {
  let element: Element | null = node
  while (element && element !== document.body) {
    const explicit = element.getAttribute('data-field') ?? element.getAttribute('data-project-field')
    if (explicit) {
      const [section, ...rest] = explicit.split(':')
      const path = rest.join(':')
      return { path, section, text: normalise(element.textContent ?? ''), kind: 'text', value: path }
    }
    if (element.tagName === 'IMG') {
      return matchByImage(index, (element as HTMLImageElement).src)
    }
    element = element.parentElement
  }
  if (node) {
    const image = node.querySelector?.('img')
    if (image) {
      const byImage = matchByImage(index, (image as HTMLImageElement).src)
      if (byImage) return byImage
    }
  }
  return matchByText(index, node?.textContent ?? '')
}

/* ------------------------------------------------------------- typed on the page */

/**
 * Can this element be rewritten in place?
 *
 * Deliberately strict: only plain text, no child markup (typing over it would
 * destroy the layout), not a form control, short enough to be a label or a
 * sentence, and — importantly — no `{{token}}`. The page shows the *interpolated*
 * value, so writing that back would replace the token with a frozen copy of the
 * company details and quietly break the single-source-of-truth rule.
 */
const canEditText = (node: string): boolean => {
  const text = node.trim()
  if (text.length === 0 || text.length > 400) return false
  if (text.includes('{{') || text.includes('}}')) return false
  return true
}

/**
 * Decorative children — a hairline rule, an icon — carry no words, so an element
 * holding only those is still one field and safe to type over. Anything with real
 * text inside it (an accent line, a link) is not.
 */
const isDecoration = (child: Element): boolean =>
  child.getAttribute('aria-hidden') === 'true' && (child.textContent ?? '').trim().length === 0

const canEditInPlace = (element: Element | null, entry: Entry): element is EditableNode => {
  if (!element || entry.kind !== 'text') return false
  if (!Array.from(element.children).every(isDecoration)) return false
  if (/^(input|textarea|select|option|button|a)$/i.test(element.tagName)) return false
  if (element.closest('[data-toc-noedit]')) return false
  return canEditText(element.textContent ?? '')
}

/**
 * The exact text node under the pointer.
 *
 * A heading is often two fields drawn in one element (`Building with Purpose.`
 * followed by a line break and an italic accent), so the element itself is not a
 * single field and must not be typed over. The text node, however, is exactly one
 * field — which is what makes a split headline editable line by line.
 */
const textNodeAt = (x: number, y: number): Text | null => {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null
  }
  let node: Node | null = null
  try {
    if (typeof doc.caretRangeFromPoint === 'function') node = doc.caretRangeFromPoint(x, y)?.startContainer ?? null
    else if (typeof doc.caretPositionFromPoint === 'function') node = doc.caretPositionFromPoint(x, y)?.offsetNode ?? null
  } catch {
    return null
  }
  return node && node.nodeType === Node.TEXT_NODE ? (node as Text) : null
}

/**
 * A field whose value is exactly the text under the cursor.
 *
 * Preferred over matching the whole element, so clicking one line of a composite
 * heading opens (and edits) that line and not its neighbour.
 */
const entryFromPoint = (x: number, y: number): { entry: Entry; node: Text } | null => {
  const node = textNodeAt(x, y)
  if (!node) return null
  const text = normalise(node.data ?? '')
  if (text.length < 3) return null
  const exact = index.filter((item) => item.kind === 'text' && item.text === text)
  if (exact.length !== 1) return null
  return { entry: exact[0], node }
}

type EditableNode = HTMLElement
let editing: {
  element: EditableNode
  /** The precise text node being typed into, when it is a direct child */
  node: Text | null
  field: string
  original: string
  onInput: () => void
  onKey: (event: KeyboardEvent) => void
  onBlur: () => void
} | null = null

const finishInlineEdit = (): void => {
  if (!editing) return
  const { element, field, onInput, onKey, onBlur } = editing
  element.removeEventListener('input', onInput)
  element.removeEventListener('keydown', onKey)
  element.removeEventListener('blur', onBlur)
  element.removeAttribute('contenteditable')
  element.removeAttribute('data-toc-editing')
  document.documentElement.removeAttribute('data-toc-editing')
  editing = null
  post({ type: 'toc:preview:edit:end', field })
}

let editFrame = 0

const beginInlineEdit = (element: EditableNode, entry: Entry, node: Text | null = null): void => {
  if (editing?.element === element && editing.node === node) {
    // Already editing this one: let the browser place the caret itself.
    return
  }
  finishInlineEdit()

  const field = messagePath(entry)
  // When a precise text node is known, only that node is read back — so typing on
  // one line of a two-line heading cannot swallow the other line.
  const edited: Text | null = node && node.parentElement === element ? node : null
  const original = (edited ? edited.data : element.textContent) ?? ''

  const onInput = (): void => {
    if (editFrame) return
    editFrame = window.requestAnimationFrame(() => {
      editFrame = 0
      if (!editing) return
      const caret = window.getSelection()?.anchorNode ?? null
      let text = ''
      if (editing.node) {
        // Ignore keystrokes that landed in a sibling element (another field).
        if (caret && caret !== editing.node && caret.parentElement !== editing.element) return
        text = editing.node.data
      } else {
        text = editing.element.textContent ?? ''
      }
      post({ type: 'toc:preview:edit', field, text: text.trim() })
    })
  }
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      // Put the wording back — in the page *and* in the draft. Restoring only the
      // page would be a lie: every keystroke is already saved, so the text would
      // reappear the moment the draft was pushed back.
      if (editing!.node) editing!.node.data = original
      else editing!.element.textContent = original
      post({ type: 'toc:preview:edit', field, text: original.trim() })
      editing!.element.blur()
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      editing!.element.blur()
    }
  }
  const onBlur = (): void => {
    const text = ((edited ? edited.data : element.textContent) ?? '').trim()
    finishInlineEdit()
    if (text && text !== original.trim()) post({ type: 'toc:preview:edit', field, text })
  }

  editing = { element, node: edited, field, original, onInput, onKey, onBlur }
  element.setAttribute('contenteditable', 'plaintext-only')
  if (element.getAttribute('contenteditable') !== 'plaintext-only') element.setAttribute('contenteditable', 'true')
  element.setAttribute('data-toc-editing', '')
  document.documentElement.setAttribute('data-toc-editing', '')
  element.addEventListener('input', onInput)
  element.addEventListener('keydown', onKey)
  element.addEventListener('blur', onBlur)
  element.focus()
  post({ type: 'toc:preview:edit:begin', field })
}

/* ------------------------------------------------------------------ outline */

const OUTLINE_ID = 'toc-preview-outline'
const SELECTED_ATTR = 'data-toc-selected'

const ensureStyles = (): void => {
  if (document.getElementById(OUTLINE_ID)) return
  const style = document.createElement('style')
  style.id = OUTLINE_ID
  // Editor chrome — only ever injected in preview mode.
  style.textContent = `
    html[data-toc-preview] [data-toc-hover] { outline: 1px solid rgba(167,139,100,0.9); outline-offset: 2px; cursor: pointer; }
    html[data-toc-preview] [${SELECTED_ATTR}] { outline: 2px solid #A78B64; outline-offset: 2px; }
    html[data-toc-preview] [data-toc-editing] {
      outline: 2px solid #A78B64; outline-offset: 3px; background: rgba(167,139,100,0.10);
      cursor: text; caret-color: #A78B64;
    }
    html[data-toc-editing] body::after { content: 'Typing on the page — Enter keeps it, Esc puts the original back'; }
    html[data-toc-preview] a, html[data-toc-preview] button { cursor: pointer; }
    html[data-toc-preview] body::after {
      content: 'Editing in preview — click anything to change it';
      position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%);
      z-index: 2147483647; background: #242724; color: #F5F2EC;
      font: 600 10px/1 Manrope, system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase;
      padding: 8px 14px; border-radius: 999px; opacity: .92; pointer-events: none;
    }
  `
  document.head.appendChild(style)
  document.documentElement.setAttribute('data-toc-preview', '')
}

const setOutline = (element: Element | null): void => {
  document.querySelectorAll('[data-toc-hover]').forEach((node) => node.removeAttribute('data-toc-hover'))
  if (element) element.setAttribute('data-toc-hover', '')
}

const setSelected = (element: Element | null): void => {
  document.querySelectorAll(`[${SELECTED_ATTR}]`).forEach((node) => node.removeAttribute(SELECTED_ATTR))
  if (element) element.setAttribute(SELECTED_ATTR, '')
}

/** Find the element that shows a given field, to highlight or scroll to it. */
export const elementForField = (field: string): Element | null => {
  const explicit = document.querySelector(`[data-field="${field}"]`)
  if (explicit) return explicit
  const [section, ...rest] = field.split('.')
  const wanted = rest.join('.')
  const entry = index.find((item) => item.section === section && (item.path === field || item.path === wanted))
  if (!entry) return null
  if (entry.kind === 'image') {
    const image = Array.from(document.querySelectorAll('img')).find((node) => node.src.includes(entry.value))
    return image ?? null
  }
  const candidates = Array.from(document.querySelectorAll('h1,h2,h3,h4,p,span,a,li,blockquote,figcaption,div'))
  return candidates.find((node) => normalise(node.textContent ?? '') === entry.text) ?? null
}

/* ----------------------------------------------------------------- install */

let installed = false
let hoverFrame = 0

/**
 * Wires the page up for editing. Returns a disposer — the provider calls it when
 * the iframe goes away.
 */
export const installPreviewBridge = (handlers: {
  onContent: (content: SiteContent) => void
}): (() => void) => {
  if (installed) return () => undefined
  installed = true
  ensureStyles()
  document.documentElement.setAttribute('data-toc-preview', '')

  const onClick = (event: MouseEvent): void => {
    const target = event.target as Element | null
    if (!target) return
    // A second click inside something already being typed into belongs to the
    // caret, not to the editor.
    if (editing && editing.element.contains(target)) return
    // Ctrl/Cmd-click keeps real navigation (opens the page in a tab) so the
    // editor never traps the person using it.
    if (event.metaKey || event.ctrlKey) return
    const project = target.closest('[data-toc-project]')
    if (project) {
      event.preventDefault()
      event.stopPropagation()
      post({ type: 'toc:preview:select', field: `project:${project.getAttribute('data-toc-project') ?? ''}`, label: 'Project' })
      return
    }
    const precise = entryFromPoint(event.clientX, event.clientY)
    const entry = precise?.entry ?? resolveField(target)
    if (!entry) return
    event.preventDefault()
    event.stopPropagation()
    const element = target.closest('[data-field]') ?? (precise?.node.parentElement || target)
    setSelected(element)
    post({ type: 'toc:preview:select', field: `field:${messagePath(entry)}`, label: describe(entry) })

    // Text can be rewritten in place — the fastest way to change a heading is to
    // click it and type. A precise text node wins; otherwise the element must be
    // wholly one field (typing over mixed content would destroy the markup).
    if (precise && precise.node.parentElement && canEditText(precise.node.data)) {
      beginInlineEdit(precise.node.parentElement, precise.entry, precise.node)
      return
    }
    if (canEditInPlace(element, entry)) beginInlineEdit(element, entry)
  }

  const onMove = (event: MouseEvent): void => {
    const target = event.target as Element | null
    if (hoverFrame) return
    hoverFrame = window.requestAnimationFrame(() => {
      hoverFrame = 0
      const entry = target ? resolveField(target) : null
      if (!entry) {
        setOutline(null)
        post({ type: 'toc:preview:hover', field: null, label: '' })
        return
      }
      const element = target?.closest('[data-field]') ?? target ?? null
      setOutline(element)
      post({ type: 'toc:preview:hover', field: `field:${messagePath(entry)}`, label: describe(entry) })
    })
  }

  const onMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin) return
    const data = event.data as PreviewMessage | null
    if (!data || typeof data !== 'object') return
    if (data.type === 'toc:preview:content') {
      handlers.onContent(data.content)
      setPreviewContent(data.content)
    }
    if (data.type === 'toc:preview:highlight') {
      const field = data.field
      setSelected(null)
      if (!field) return
      const element = elementForField(field.replace(/^field:/, ''))
      if (element) {
        setSelected(element)
        const box = element.getBoundingClientRect()
        if (box.top < 0 || box.bottom > window.innerHeight) {
          element.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      }
    }
  }

  document.addEventListener('click', onClick, true)
  document.addEventListener('mousemove', onMove, true)
  window.addEventListener('message', onMessage)
  post({ type: 'toc:preview:ready' })

  return () => {
    installed = false
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('mousemove', onMove, true)
    window.removeEventListener('message', onMessage)
  }
}
