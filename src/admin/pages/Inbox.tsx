import { useCallback, useEffect, useState } from 'react'
import {
  deleteSubmission,
  listSubmissions,
  patchSubmission,
  submissionsCsvUrl,
  type InboxResponse,
  type Submission,
  type SubmissionKind,
} from '../../lib/api'
import { Badge, Button, Card, InlineNotice } from '../ui'

const kindLabels: Record<SubmissionKind, string> = {
  inquiry: 'Quote request',
  consultation: 'Consultation request',
}

/** What visitors have sent through the forms. */
export function Inbox() {
  const [data, setData] = useState<InboxResponse | null>(null)
  const [filter, setFilter] = useState<'all' | SubmissionKind | 'archived'>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await listSubmissions())
      setProblem(null)
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : 'The inbox could not be loaded.')
      setData({ submissions: [], counts: { total: 0, unread: 0, inquiry: 0, consultation: 0, archived: 0 } })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = (data?.submissions ?? []).filter((item) => {
    if (filter === 'all') return !item.archived
    if (filter === 'archived') return item.archived
    return item.kind === filter && !item.archived
  })

  const update = async (submission: Submission, patch: { read?: boolean; archived?: boolean }) => {
    try {
      await patchSubmission(submission.id, patch)
      await load()
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : 'The change could not be saved.')
    }
  }

  const remove = async (submission: Submission) => {
    if (!window.confirm('Delete this enquiry permanently? Consider archiving it instead.')) return
    try {
      await deleteSubmission(submission.id)
      await load()
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : 'The enquiry could not be deleted.')
    }
  }

  const filters: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all', label: 'Inbox', count: data ? data.counts.total - data.counts.archived : 0 },
    { key: 'inquiry', label: 'Quote requests', count: data?.counts.inquiry ?? 0 },
    { key: 'consultation', label: 'Consultations', count: data?.counts.consultation ?? 0 },
    { key: 'archived', label: 'Archived', count: data?.counts.archived ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.25rem] leading-tight text-charcoal">Enquiries</h1>
          <p className="mt-2 max-w-2xl font-sans text-[0.9375rem] leading-relaxed text-stone-600">
            Every quote request and consultation request submitted through the website. Nothing is emailed — this page
            <em> is</em> the record, so check it regularly or export it to a spreadsheet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={submissionsCsvUrl()}
            className="border border-charcoal/20 px-4 py-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-charcoal"
          >
            Download CSV
          </a>
          <Button tone="primary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </header>

      {problem ? <InlineNotice tone="error">{problem}</InlineNotice> : null}

      {(data?.counts.unread ?? 0) > 0 ? (
        <InlineNotice tone="warning">
          {data?.counts.unread} unread {data?.counts.unread === 1 ? 'enquiry' : 'enquiries'}.
        </InlineNotice>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setFilter(entry.key)}
            aria-pressed={filter === entry.key}
            className={`border px-3.5 py-2 font-sans text-[0.6875rem] uppercase tracking-eyebrow transition-colors ${
              filter === entry.key
                ? 'border-charcoal bg-charcoal text-ivory'
                : 'border-charcoal/20 text-stone-600 hover:border-charcoal hover:text-charcoal'
            }`}
          >
            {entry.label}
            <span className={`ml-2 ${filter === entry.key ? 'text-ivory/60' : 'text-stone-400'}`}>{entry.count}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card title="Nothing here yet">
          <p className="font-sans text-[0.875rem] leading-relaxed text-stone-600">
            When someone uses the quote form or requests a consultation, their details appear here within seconds. You can
            also reach the same people on WhatsApp — the number is in the header of every page.
          </p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {visible.map((submission) => {
          const expanded = open === submission.id
          const entries = Object.entries(submission.data).filter(([, value]) => value !== '' && value !== false)
          return (
            <article
              key={submission.id}
              className={`border bg-white ${submission.read ? 'border-charcoal/12' : 'border-bronze/55'}`}
            >
              <header className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(expanded ? null : submission.id)
                    if (!submission.read) void update(submission, { read: true })
                  }}
                  aria-expanded={expanded}
                  className="flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[1.25rem] text-charcoal">
                      {String(submission.data.fullName || 'Unknown')}
                    </span>
                    {!submission.read ? <Badge tone="draft">Unread</Badge> : null}
                    {submission.archived ? <Badge tone="muted">Archived</Badge> : null}
                    <Badge tone="muted">{kindLabels[submission.kind]}</Badge>
                  </span>
                  <span className="mt-1 block font-sans text-[0.8125rem] text-stone-600">
                    {String(submission.data.phone || '')} · {new Date(submission.createdAt).toLocaleString()}
                    {submission.data.service ? ` · ${String(submission.data.service)}` : ''}
                  </span>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${String(submission.data.phone || '').replace(/[^+\d]/g, '')}`}
                    className="border border-charcoal/25 px-4 py-2.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-charcoal"
                  >
                    Call
                  </a>
                  <Button onClick={() => void update(submission, { read: !submission.read })}>
                    Mark {submission.read ? 'unread' : 'read'}
                  </Button>
                  <Button onClick={() => void update(submission, { archived: !submission.archived })}>
                    {submission.archived ? 'Restore' : 'Archive'}
                  </Button>
                  <Button tone="danger" onClick={() => void remove(submission)}>
                    Delete
                  </Button>
                </div>
              </header>

              {expanded ? (
                <div className="border-t border-charcoal/10 px-4 py-4">
                  <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {entries.map(([key, value]) => (
                      <div key={key} className="border-b border-charcoal/8 pb-2">
                        <dt className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-500">{key}</dt>
                        <dd className="mt-1 font-sans text-[0.875rem] leading-relaxed whitespace-pre-wrap text-charcoal">
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 font-sans text-[0.6875rem] text-stone-400">
                    Received {new Date(submission.createdAt).toLocaleString()} · reference {submission.id.slice(0, 8)}
                    {submission.meta?.ip ? ` · from ${submission.meta.ip}` : ''}
                  </p>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
