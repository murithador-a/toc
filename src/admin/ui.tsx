import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { uploadImage } from '../lib/api'
import { MediaPicker } from './MediaPicker'
import type { ContentImage } from '../content/types'
import { formatBytes } from './fields'

/**
 * Admin UI primitives.
 * ---------------------------------------------------------------------------
 * Utilitarian and quiet: the admin borrows the site's palette and type so it
 * feels like the same product, but every control is a plain bordered field so
 * nothing is ambiguous about what is editable.
 */

/* ------------------------------------------------------------------- layout */

export function Card({
  title,
  description,
  children,
  actions,
  id,
}: {
  title?: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  id?: string
}) {
  return (
    <section id={id} className="border border-charcoal/12 bg-white">
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-charcoal/10 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-[1.35rem] leading-snug text-charcoal">{title}</h2>
            {description ? (
              <p className="mt-1.5 max-w-2xl font-sans text-[0.8125rem] leading-relaxed text-stone-600">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}

export function FieldRow({
  label,
  help,
  htmlFor,
  wide,
  children,
  error,
  field,
}: {
  label?: string
  help?: string
  htmlFor?: string
  wide?: boolean
  children: ReactNode
  error?: string
  /** The content path this control edits — a stable hook for testing */
  field?: string
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''} data-field={field}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500"
        >
          {label}
        </label>
      ) : null}
      <div className={label ? 'mt-2' : ''}>{children}</div>
      {error ? <p className="mt-1.5 font-sans text-[0.75rem] text-[#8d3b2f]">{error}</p> : null}
      {help ? <p className="mt-1.5 font-sans text-[0.75rem] leading-relaxed text-stone-500">{help}</p> : null}
    </div>
  )
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const columns = cols === 1 ? '' : cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return <div className={`grid gap-5 ${columns}`}>{children}</div>
}

/* ------------------------------------------------------------------ controls */

const inputClass =
  'w-full border border-charcoal/20 bg-white px-3 py-2.5 font-sans text-[0.9375rem] text-charcoal transition-colors placeholder:text-stone-400 focus:border-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-1'

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  min,
  max,
  step,
  id,
  disabled,
}: {
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'url' | 'date' | 'password' | 'email'
  maxLength?: number
  min?: number
  max?: number
  step?: number
  id?: string
  disabled?: boolean
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />
  )
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
  maxLength,
  id,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  maxLength?: number
  id?: string
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClass} leading-relaxed`}
    />
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  help?: string
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 ${
          checked ? 'border-charcoal bg-charcoal' : 'border-charcoal/25 bg-stone-100'
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-4 w-4 bg-white transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
      <div>
        <label htmlFor={id} className="font-sans text-[0.875rem] leading-snug text-charcoal">
          {label}
        </label>
        {help ? <p className="mt-1 font-sans text-[0.75rem] leading-relaxed text-stone-500">{help}</p> : null}
      </div>
    </div>
  )
}

type ButtonTone = 'primary' | 'outline' | 'quiet' | 'danger'

export function Button({
  children,
  onClick,
  tone = 'outline',
  type = 'button',
  disabled,
  className = '',
  title,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: ButtonTone
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  title?: string
}) {
  const tones: Record<ButtonTone, string> = {
    primary: 'border-charcoal bg-charcoal text-ivory hover:bg-[#141613]',
    outline: 'border-charcoal/25 bg-white text-charcoal hover:border-charcoal',
    quiet: 'border-transparent bg-transparent text-stone-600 hover:text-charcoal',
    danger: 'border-[#b9887f] bg-white text-[#8d3b2f] hover:border-[#8d3b2f]',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 border px-4 py-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- image */

export function ImageField({
  image,
  onChange,
  label,
  field,
}: {
  image: ContentImage | undefined
  onChange: (next: ContentImage) => void
  label?: string
  /** Content path this image belongs to — used to label the individual controls */
  field?: string
}) {
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const current: ContentImage = image ?? { src: '', alt: '' }

  const patch = (values: Partial<ContentImage>) => onChange({ ...current, ...values })

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setProblem(null)
    try {
      const result = await uploadImage(file)
      patch({ src: result.url, width: result.width, height: result.height })
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : 'The image could not be uploaded.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="border border-charcoal/12 bg-ivory/60 p-4" data-field={field}>
      {label ? (
        <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500">{label}</p>
      ) : null}

      <div className="mt-3 flex flex-col gap-4 sm:flex-row">
        <div className="h-[8.5rem] w-full shrink-0 overflow-hidden border border-charcoal/12 bg-stone-100 sm:w-[13rem]">
          {current.src ? (
            <img src={current.src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center font-sans text-[0.75rem] text-stone-500">
              No image set
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={busy} tone="primary">
              {busy ? 'Uploading…' : current.src ? 'Replace image' : 'Upload image'}
            </Button>
            <Button tone="outline" onClick={() => setPickerOpen(true)} disabled={busy}>
              Choose a photo
            </Button>
            {current.src ? (
              <Button onClick={() => patch({ src: '', width: undefined, height: undefined })} tone="quiet">
                Remove
              </Button>
            ) : null}
            {current.width && current.height ? (
              <span className="font-sans text-[0.75rem] text-stone-500">
                {current.width} × {current.height}
              </span>
            ) : null}
          </div>

          <FieldRow
            label="Image address"
            field="src"
            help="Set automatically by an upload. You can also paste a path such as /images/hero-residence-1920.webp"
          >
            <TextInput value={current.src} onChange={(value) => patch({ src: value })} placeholder="/uploads/… or /images/…" />
          </FieldRow>

          <FieldRow
            label="Description (alt text)"
            field="alt"
            help="Describe the photograph for screen readers and for when the image fails to load. Required."
          >
            <TextInput value={current.alt} onChange={(value) => patch({ alt: value })} placeholder="e.g. Reinforced concrete frame under construction" />
          </FieldRow>

          {problem ? <p className="font-sans text-[0.75rem] text-[#8d3b2f]">{problem}</p> : null}
          {current.src && current.alt.trim().length === 0 ? (
            <p className="font-sans text-[0.75rem] text-[#8d3b2f]">
              This image has no description yet — screen readers and search engines need one.
            </p>
          ) : null}

          <details className="border-t border-charcoal/10 pt-3">
            <summary className="cursor-pointer font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-500">
              Caption, crop and responsive set
            </summary>
            <div className="mt-3 space-y-3">
              <FieldRow label="Caption" field="caption" help="Shown beneath the image. Use it to mark reference imagery.">
                <TextInput value={current.caption ?? ''} onChange={(value) => patch({ caption: value })} />
              </FieldRow>
              <FieldRow label="Crop position" field="focal" help='CSS object-position, e.g. "50% 40%" to favour the upper part of a wide photograph.'>
                <TextInput value={current.focal ?? ''} onChange={(value) => patch({ focal: value })} placeholder="50% 50%" />
              </FieldRow>
              <FieldRow
                label="Responsive candidates"
                field="srcset"
                help="Optional. A comma-separated list of wider/narrower versions, e.g. /uploads/x-900.webp 900w, /uploads/x-1400.webp 1400w"
              >
                <TextArea value={current.srcset ?? ''} onChange={(value) => patch({ srcset: value })} rows={2} />
              </FieldRow>
            </div>
          </details>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(picked) =>
          patch({
            src: picked.src,
            width: picked.width ?? current.width,
            height: picked.height ?? current.height,
          })
        }
      />
    </div>
  )
}

/* -------------------------------------------------------------------- lists */

export function ListItemShell({
  title,
  subtitle,
  children,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDuplicate,
  dragHandlers,
  dropTarget,
  canMoveUp,
  canMoveDown,
  badge,
  defaultOpen = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
  onDuplicate?: () => void
  /** Making the handle draggable lets the whole list be reordered by mouse */
  dragHandlers?: {
    onDragStart: (event: React.DragEvent) => void
    onDragEnd: () => void
    onDragOver: (event: React.DragEvent) => void
    onDrop: (event: React.DragEvent) => void
  }
  dropTarget?: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  badge?: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className={
        'border bg-white transition-colors ' +
        (dropTarget ? 'border-bronze ring-1 ring-bronze' : 'border-charcoal/12')
      }
      onDragOver={dragHandlers?.onDragOver}
      onDrop={dragHandlers?.onDrop}
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {dragHandlers ? (
          <span
            aria-hidden="true"
            draggable
            onDragStart={dragHandlers.onDragStart}
            onDragEnd={dragHandlers.onDragEnd}
            title="Drag to reorder"
            className="cursor-grab select-none border border-charcoal/15 px-2 py-1.5 font-sans text-[0.75rem] leading-none text-stone-500 active:cursor-grabbing"
          >
            ⠿
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
        >
          <span aria-hidden="true" className="font-sans text-[0.75rem] text-bronze">
            {open ? '−' : '+'}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-sans text-[0.9375rem] text-charcoal">{title || 'Untitled'}</span>
            {subtitle ? <span className="mt-0.5 block truncate font-sans text-[0.75rem] text-stone-500">{subtitle}</span> : null}
          </span>
        </button>
        {badge}
        <div className="flex items-center gap-1">
          {onMoveUp ? (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label="Move up"
              className="border border-charcoal/15 px-2.5 py-1.5 font-sans text-[0.75rem] text-stone-600 transition-colors hover:border-charcoal hover:text-charcoal disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              ↑
            </button>
          ) : null}
          {onMoveDown ? (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label="Move down"
              className="border border-charcoal/15 px-2.5 py-1.5 font-sans text-[0.75rem] text-stone-600 transition-colors hover:border-charcoal hover:text-charcoal disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              ↓
            </button>
          ) : null}
          {onDuplicate ? (
            <button
              type="button"
              onClick={onDuplicate}
              className="border border-charcoal/15 px-3 py-1.5 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-600 transition-colors hover:border-charcoal hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              Duplicate
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="border border-charcoal/15 px-3 py-1.5 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-stone-600 transition-colors hover:border-[#8d3b2f] hover:text-[#8d3b2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
      {open ? <div className="border-t border-charcoal/10 px-4 py-4">{children}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------------- status */

export function Badge({ tone, children }: { tone: 'draft' | 'live' | 'placeholder' | 'muted'; children: ReactNode }) {
  const tones = {
    draft: 'border-bronze/50 text-bronze',
    live: 'border-charcoal/25 bg-charcoal text-ivory',
    placeholder: 'border-[#b9887f] text-[#8d3b2f]',
    muted: 'border-charcoal/15 text-stone-500',
  }
  return (
    <span className={`border px-2 py-1 font-sans text-[0.5625rem] uppercase tracking-eyebrow ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function InlineNotice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning' | 'error'
  children: ReactNode
}) {
  const tones = {
    info: 'border-charcoal/15 bg-ivory text-stone-600',
    warning: 'border-bronze/45 bg-[#FBF7F0] text-[#6b5637]',
    error: 'border-[#c9a49c] bg-[#FBF3F1] text-[#8d3b2f]',
  }
  return (
    <div className={`border px-4 py-3 font-sans text-[0.8125rem] leading-relaxed ${tones[tone]}`}>{children}</div>
  )
}

/** Relative “saved 3 minutes ago” label for the header. */
export function useRelativeTime(iso: string | null): string {
  const [label, setLabel] = useState('')
  useEffect(() => {
    if (!iso) {
      setLabel('')
      return
    }
    const update = () => {
      const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
      if (seconds < 5) setLabel('just now')
      else if (seconds < 60) setLabel(`${seconds} seconds ago`)
      else if (seconds < 3600) setLabel(`${Math.round(seconds / 60)} minutes ago`)
      else setLabel(new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const timer = window.setInterval(update, 15_000)
    return () => window.clearInterval(timer)
  }, [iso])
  return label
}

export { formatBytes }
