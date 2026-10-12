import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../AdminProvider'
import { listSubmissions, type InboxResponse } from '../../lib/api'
import { Button, Card, InlineNotice } from '../ui'
import { sectionSchemas } from '../schema'
import { visualLink } from '../routes'

/** Landing screen: what needs attention, and a way into everything else. */

type Issue = { id: string; tone: 'warning' | 'info'; title: string; detail: string; to: string; action: string }

/** Every image anywhere in the document, with the field path that holds it. */
const findImages = (content: unknown): { section: string; field: string; alt: string; src: string }[] => {
  const found: { section: string; field: string; alt: string; src: string }[] = []
  const walk = (node: unknown, section: string, path: string[]): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, section, [...path, '[' + index + ']']))
      return
    }
    if (!node || typeof node !== 'object') return
    const record = node as Record<string, unknown>
    if (typeof record.src === 'string' && typeof record.alt === 'string') {
      found.push({
        section: path[0] ?? section,
        field: [...path.slice(1)].join('.') || 'image',
        alt: record.alt,
        src: record.src,
      })
      return
    }
    for (const [key, value] of Object.entries(record)) walk(value, section, [...path, key])
  }
  for (const [section, value] of Object.entries(content as Record<string, unknown>)) {
    walk(value, section, [section])
  }
  return found
}

export function Dashboard() {
  const { content, contentLoading } = useAdmin()
  const [inbox, setInbox] = useState<InboxResponse | null>(null)

  useEffect(() => {
    void listSubmissions()
      .then(setInbox)
      .catch(() => setInbox(null))
  }, [])

  if (contentLoading || !content) {
    return <p className="font-sans text-[0.875rem] text-stone-500">Loading your website content…</p>
  }

  const projects = content.projects as { items: { status: string; isPlaceholder: boolean; title: string }[] }
  const services = content.services as { items: { published: boolean }[] }
  const company = content.company as { hasOpeningHours: boolean; hasEmail: boolean }
  const hero = content.home as { hero: { headline: string } }
  const drafts = projects.items.filter((item) => item.status === 'draft')
  const placeholders = projects.items.filter((item) => item.isPlaceholder)
  const images = findImages(content)
  const missingAlt = images.filter((image) => image.alt.trim().length === 0)

  const issues: Issue[] = []

  if (hero.hero.headline.trim().length === 0) {
    issues.push({
      id: 'headline',
      tone: 'warning',
      title: 'The home page has no headline',
      detail: 'The largest text on the site is empty, so the hero reads as a blank block.',
      to: visualLink('home', 'hero.headline'),
      action: 'Fix it',
    })
  }

  if (missingAlt.length > 0) {
    issues.push({
      id: 'alt',
      tone: 'warning',
      title: missingAlt.length === 1 ? '1 photograph has no description' : missingAlt.length + ' photographs have no description',
      detail:
        'Descriptions (alt text) are what a screen reader says and what search engines read. Example: ' +
        (missingAlt[0] ? missingAlt[0].section + ' › ' + missingAlt[0].field : ''),
      to: visualLink(missingAlt[0]?.section ?? 'home', missingAlt[0]?.field),
      action: 'Describe them',
    })
  }

  if (drafts.length > 0) {
    issues.push({
      id: 'drafts',
      tone: 'warning',
      title: drafts.length === 1 ? '1 project is still a draft' : drafts.length + ' projects are still drafts',
      detail: 'Drafts are saved but hidden from the public site. Publish them when the entry is ready.',
      to: '/admin/projects',
      action: 'Review projects',
    })
  }

  if (placeholders.length > 0) {
    issues.push({
      id: 'placeholders',
      tone: 'info',
      title: placeholders.length + ' entries are layout placeholders',
      detail:
        'They hold the grid and carry a visible notice so nobody mistakes them for completed TOC work. Replace them with real photography and details, then switch the placeholder flag off.',
      to: '/admin/projects',
      action: 'Open projects',
    })
  }

  if (!company.hasOpeningHours || !company.hasEmail) {
    issues.push({
      id: 'unconfirmed',
      tone: 'info',
      title: 'Some company details are deliberately hidden',
      detail:
        (!company.hasOpeningHours ? 'Opening hours ' : '') +
        (!company.hasOpeningHours && !company.hasEmail ? 'and ' : '') +
        (!company.hasEmail ? 'an email address ' : '') +
        'are not shown because TOC has not confirmed them. Switch them on in Company details once confirmed.',
      to: '/admin/content/company',
      action: 'Company details',
    })
  }

  const tiles = [
    {
      label: 'Projects',
      value: projects.items.length,
      detail: projects.items.length - drafts.length + ' published · ' + drafts.length + ' draft',
      to: '/admin/projects',
      action: 'Add or edit projects',
    },
    {
      label: 'Services',
      value: services.items.length,
      detail: services.items.filter((service) => service.published).length + ' visible on the site',
      to: '/admin/content/services',
      action: 'Edit services',
    },
    {
      label: 'Enquiries',
      value: inbox?.counts.total ?? '—',
      detail: inbox ? inbox.counts.unread + ' unread' : 'Open the inbox to check',
      to: '/admin/inbox',
      action: 'Open the inbox',
    },
    {
      label: 'Images',
      value: images.length,
      detail: 'Photographs used across the site',
      to: '/admin/media',
      action: 'Manage images',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-[2.25rem] leading-tight text-charcoal">Dashboard</h1>
          <p className="mt-2 max-w-2xl font-sans text-[0.9375rem] leading-relaxed text-stone-600">
            Everything on the public website is edited from here. The quickest way in is the visual editor: click
            anything on the page and change it.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/visual">
            <Button tone="primary">Open the visual editor</Button>
          </Link>
          <a href="/" target="_blank" rel="noreferrer">
            <Button>View the live site</Button>
          </a>
        </div>
      </div>

      {issues.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={
                'flex flex-col border bg-white p-5 ' +
                (issue.tone === 'warning' ? 'border-[#d9b9ae]' : 'border-charcoal/12')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-sans text-[0.9375rem] font-semibold text-charcoal">{issue.title}</p>
                <span
                  className={
                    'shrink-0 border px-2 py-1 font-sans text-[0.5625rem] uppercase tracking-eyebrow ' +
                    (issue.tone === 'warning' ? 'border-[#c9a49c] text-[#8d3b2f]' : 'border-bronze/50 text-bronze')
                  }
                >
                  {issue.tone === 'warning' ? 'Needs attention' : 'Worth knowing'}
                </span>
              </div>
              <p className="mt-2 flex-1 font-sans text-[0.8125rem] leading-relaxed text-stone-600">{issue.detail}</p>
              <Link
                to={issue.to}
                className="mt-3 inline-flex font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal underline-offset-8 hover:text-bronze hover:underline"
              >
                {issue.action} →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <InlineNotice>
          Nothing needs attention: every photograph has a description, nothing is left as a draft and no placeholder
          entries remain.
        </InlineNotice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col border border-charcoal/12 bg-white p-5">
            <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-stone-500">
              {tile.label}
            </p>
            <p className="mt-3 font-display text-[2rem] leading-none text-charcoal">{tile.value}</p>
            <p className="mt-2 flex-1 font-sans text-[0.8125rem] text-stone-600">{tile.detail}</p>
            <Link
              to={tile.to}
              className="mt-4 inline-flex font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal underline-offset-8 hover:text-bronze hover:underline"
            >
              {tile.action} →
            </Link>
          </div>
        ))}
      </div>

      <Card
        title="Add a project"
        description="Projects are the strongest section of the site. A new entry stays a draft until you publish it."
        actions={
          <Link to="/admin/projects/new">
            <Button tone="primary">Add a project</Button>
          </Link>
        }
      >
        <ol className="grid gap-4 font-sans text-[0.875rem] leading-relaxed text-stone-600 sm:grid-cols-3">
          <li className="border-l-2 border-bronze/50 pl-4">
            <span className="block font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              Step one
            </span>
            Title, category and a one-line summary.
          </li>
          <li className="border-l-2 border-bronze/50 pl-4">
            <span className="block font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              Step two
            </span>
            Pick or upload the cover photograph, then describe it.
          </li>
          <li className="border-l-2 border-bronze/50 pl-4">
            <span className="block font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
              Step three
            </span>
            Location, type, scope of works, then publish.
          </li>
        </ol>
      </Card>

      <Card
        title="Page content"
        description="Every heading, paragraph and form option on the site. Open any of them in the visual editor to change them against the real page."
      >
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {sectionSchemas.map((schema) => (
            <div key={schema.key} className="flex items-center justify-between gap-3 border-b border-charcoal/10 py-2.5">
              <Link
                to={visualLink(schema.key)}
                className="font-sans text-[0.875rem] text-stone-600 transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
              >
                {schema.title}
              </Link>
              <Link
                to={'/admin/content/' + schema.key}
                className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-stone-400 hover:text-bronze"
              >
                Form
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
