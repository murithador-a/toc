import { useId, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, FieldRow, Grid, ImageField, ListItemShell, TextArea, TextInput, Toggle } from './ui'
import { duplicateListItem, getAt, setAt, type Field } from './fields'
import type { ContentImage } from '../content/types'

/**
 * Renders a field descriptor against a section value.
 *
 * Every write goes through `setAt`, which returns a new object, so the caller can
 * hand the result straight to the admin store's `update()` and the debounced save
 * picks it up. The renderer never knows which section it is in.
 */

type Props = {
  field: Field
  /** The whole section value */
  value: unknown
  /** Called with the new whole-section value */
  onChange: (next: unknown) => void
}

export function FieldRenderer({ field, value, onChange }: Props) {
  const id = useId()
  const current = getAt(value, field.path)

  // Drag-to-reorder state for list fields. Hooks live here, above the switch,
  // because they must run on every render regardless of the field kind.
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const dragRef = useRef<number | null>(null)

  // `?open=<list path>&row=<index>` opens one row on arrival — how the Add menu
  // hands you a freshly created entry, ready to type into.
  const [searchParams] = useSearchParams()
  const openRow = searchParams.get('open') === field.path ? Number(searchParams.get('row') ?? -1) : -1

  const write = (next: unknown) => onChange(setAt(value, field.path, next))

  switch (field.kind) {
    case 'text':
      return (
        <FieldRow label={field.label} help={field.help} htmlFor={id} wide={field.wide} field={field.path}>
          <TextInput
            id={id}
            value={typeof current === 'string' ? current : current === undefined || current === null ? '' : String(current)}
            onChange={write}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
          />
        </FieldRow>
      )

    case 'textarea':
      return (
        <FieldRow label={field.label} help={field.help} htmlFor={id} wide={field.wide ?? true} field={field.path}>
          <TextArea
            id={id}
            value={typeof current === 'string' ? current : ''}
            onChange={write}
            rows={field.rows ?? 4}
            maxLength={field.maxLength}
          />
        </FieldRow>
      )

    case 'paragraphs': {
      const paragraphs = Array.isArray(current) ? (current as unknown[]).map(String) : []
      return (
        <FieldRow
          label={field.label}
          help={field.help ?? 'Leave a blank line between paragraphs. Each block becomes its own paragraph on the site.'}
          wide
          field={field.path}
        >
          <TextArea
            value={paragraphs.join('\n\n')}
            rows={field.rows ?? 6}
            onChange={(text) =>
              write(
                text
                  .split(/\n\s*\n/)
                  .map((block) => block.trim())
                  .filter(Boolean),
              )
            }
          />
        </FieldRow>
      )
    }

    case 'lines': {
      const lines = Array.isArray(current) ? (current as unknown[]).map(String) : []
      return (
        <FieldRow label={field.label} help={field.help ?? 'One item per line.'} wide field={field.path}>
          <TextArea
            value={lines.join('\n')}
            rows={field.rows ?? 6}
            placeholder={field.placeholder}
            onChange={(text) =>
              write(
                text
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              )
            }
          />
        </FieldRow>
      )
    }

    case 'number':
      return (
        <FieldRow label={field.label} help={field.help} htmlFor={id} field={field.path}>
          <TextInput
            id={id}
            type="number"
            value={typeof current === 'number' ? current : 0}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(text) => write(text === '' ? 0 : Number(text))}
          />
        </FieldRow>
      )

    case 'boolean':
      return (
        <div className={field.wide ? 'sm:col-span-2' : ''} data-field={field.path}>
          <Toggle
            checked={current === true}
            onChange={write}
            label={field.label}
            help={field.help}
          />
        </div>
      )

    case 'image':
      return (
        <div className="sm:col-span-2" data-field={field.path}>
          <ImageField
            label={field.label}
            image={current as ContentImage | undefined}
            onChange={(next) => write(next)}
          />
          {field.help ? (
            <p className="mt-2 font-sans text-[0.75rem] leading-relaxed text-stone-500">{field.help}</p>
          ) : null}
        </div>
      )

    case 'list': {
      const items = Array.isArray(current) ? (current as unknown[]) : []
      const move = (from: number, to: number) => {
        if (to < 0 || to >= items.length || from === to) return
        const next = [...items]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        write(next)
      }
      const duplicate = (index: number) => {
        const copy = duplicateListItem(items[index], items)
        write([...items.slice(0, index + 1), copy, ...items.slice(index + 1)])
      }
      return (
        <div className="sm:col-span-2" data-field={field.path}>
          <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500">
            {field.label}
          </p>
          {field.help ? <p className="mt-1.5 font-sans text-[0.75rem] text-stone-500">{field.help}</p> : null}

          <div className="mt-3 space-y-3">
            {items.map((item, index) => {
              const record = (item ?? {}) as Record<string, unknown>
              const title = String(record[field.itemTitle] ?? '')
              const subtitle =
                typeof record.slug === 'string'
                  ? `/${record.slug}`
                  : typeof record.to === 'string'
                    ? record.to
                    : typeof record.projectType === 'string'
                      ? String(record.projectType)
                      : undefined
              return (
                <ListItemShell
                  key={`${field.path}-${index}-${title}`}
                  title={title || `Item ${index + 1}`}
                  defaultOpen={index === openRow}
                  subtitle={subtitle}
                  canMoveUp={index > 0}
                  canMoveDown={index < items.length - 1}
                  onMoveUp={() => move(index, index - 1)}
                  onMoveDown={() => move(index, index + 1)}
                  onRemove={() => write(items.filter((_, position) => position !== index))}
                  onDuplicate={() => duplicate(index)}
                  dropTarget={dragOver === index && dragIndex !== null && dragIndex !== index}
                  dragHandlers={{
                    onDragStart: (event) => {
                      dragRef.current = index
                      setDragIndex(index)
                      event.dataTransfer.effectAllowed = 'move'
                      try {
                        event.dataTransfer.setData('text/plain', String(index))
                      } catch {
                        /* some browsers refuse custom data — the ref still works */
                      }
                    },
                    onDragEnd: () => {
                      dragRef.current = null
                      setDragIndex(null)
                      setDragOver(null)
                    },
                    onDragOver: (event) => {
                      event.preventDefault()
                      setDragOver(index)
                    },
                    onDrop: (event) => {
                      event.preventDefault()
                      const from = dragRef.current ?? Number(event.dataTransfer.getData('text/plain'))
                      dragRef.current = null
                      setDragIndex(null)
                      setDragOver(null)
                      if (Number.isFinite(from)) move(from, index)
                    },
                  }}
                  badge={
                    typeof record.published === 'boolean' ? (
                      <span
                        className={`border px-2 py-1 font-sans text-[0.5625rem] uppercase tracking-eyebrow ${
                          record.published ? 'border-charcoal/25 bg-charcoal text-ivory' : 'border-bronze/50 text-bronze'
                        }`}
                      >
                        {record.published ? 'Published' : 'Hidden'}
                      </span>
                    ) : null
                  }
                >
                  <div className="space-y-5">
                    {field.fields.map((child) => (
                      <FieldRenderer
                        key={`${child.path}-${child.kind}`}
                        field={child}
                        value={item}
                        onChange={(next) => write(items.map((entry, position) => (position === index ? next : entry)))}
                      />
                    ))}
                  </div>
                </ListItemShell>
              )
            })}
          </div>

          <div className="mt-4">
            <Button tone="primary" onClick={() => write([...items, field.blank()])}>
              {field.addLabel}
            </Button>
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

/** A group of descriptors rendered as a two-column grid. */
export function FieldGroup({
  fields,
  value,
  onChange,
  columns = 2,
}: {
  fields: Field[]
  value: unknown
  onChange: (next: unknown) => void
  columns?: 1 | 2 | 3
}) {
  return (
    <Grid cols={columns}>
      {fields.map((field) => (
        <FieldRenderer key={`${field.kind}-${field.path}-${field.label}`} field={field} value={value} onChange={onChange} />
      ))}
    </Grid>
  )
}
