import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdmin } from '../AdminProvider'
import { Badge, Button, Card, InlineNotice } from '../ui'
import { slugify } from '../fields'
import { emptyProject, type AdminProject } from './projectModel'

/** List of portfolio entries: order, publish state, placeholder state. */
export function ProjectsAdmin() {
  const { content, update } = useAdmin()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'placeholder'>('all')
  const [query, setQuery] = useState('')
  const [dragSlug, setDragSlug] = useState<string | null>(null)
  const [overSlug, setOverSlug] = useState<string | null>(null)
  const dragFrom = useRef<string | null>(null)

  const projects = (content?.projects as { items: AdminProject[]; categories: { key: string; label: string }[] } | undefined) ?? undefined

  const visible = useMemo(() => {
    if (!projects) return []
    const items = [...projects.items].sort((a, b) => a.order - b.order)
    if (filter === 'published') return items.filter((item) => item.status === 'published')
    if (filter === 'draft') return items.filter((item) => item.status === 'draft')
    if (filter === 'placeholder') return items.filter((item) => item.isPlaceholder)
    return items
  }, [projects, filter])

  const matches = (item: AdminProject) => {
    const term = query.trim().toLowerCase()
    if (term.length === 0) return true
    return [item.title, item.slug, item.location, item.projectType, item.yearCompleted, item.client]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  }

  if (!projects) {
    return <p className="font-sans text-[0.875rem] text-stone-500">Loading projects…</p>
  }

  const items = [...projects.items].sort((a, b) => a.order - b.order)

  const writeItems = (next: AdminProject[]) =>
    update('projects' as never, (draft) => {
      const record = draft as { items: AdminProject[] }
      return { ...record, items: next.map((item, index) => ({ ...item, order: index })) } as never
    })

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    writeItems(next)
  }

  const addProject = () => {
    const existing = new Set(items.map((item) => item.slug))
    let slug = 'new-project'
    let counter = 2
    while (existing.has(slug)) {
      slug = `new-project-${counter}`
      counter += 1
    }
    const project = emptyProject(slug, items.length, projects.categories[0]?.key ?? '')
    writeItems([...items, project])
    navigate(`/admin/projects/${slug}`)
  }

  const duplicate = (project: AdminProject) => {
    const existing = new Set(items.map((item) => item.slug))
    let slug = `${project.slug}-copy`
    let counter = 2
    while (existing.has(slug)) {
      slug = `${project.slug}-copy-${counter}`
      counter += 1
    }
    writeItems([
      ...items,
      {
        ...JSON.parse(JSON.stringify(project)) as AdminProject,
        slug,
        title: `${project.title} (copy)`,
        status: 'draft',
        order: items.length,
      },
    ])
  }

  const remove = (project: AdminProject) => {
    if (!window.confirm(`Delete “${project.title}”? This removes it from the website. A backup of the previous version is kept on the server.`)) return
    writeItems(items.filter((item) => item.slug !== project.slug))
  }

  const toggleStatus = (project: AdminProject) => {
    const next = project.status === 'published' ? 'draft' : 'published'
    update('projects' as never, (draft) => {
      const record = draft as { items: AdminProject[] }
      return {
        ...record,
        items: record.items.map((item) => (item.slug === project.slug ? { ...item, status: next } : item)),
      } as never
    })
  }

  const filters: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'published', label: 'Published', count: items.filter((item) => item.status === 'published').length },
    { key: 'draft', label: 'Drafts', count: items.filter((item) => item.status === 'draft').length },
    { key: 'placeholder', label: 'Placeholders', count: items.filter((item) => item.isPlaceholder).length },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.25rem] leading-tight text-charcoal">Projects</h1>
          <p className="mt-2 max-w-2xl font-sans text-[0.9375rem] leading-relaxed text-stone-600">
            Each entry becomes its own page at <code className="font-mono text-[0.8125rem]">/projects/&lt;address&gt;</code> and
            appears in the portfolio grid. Order here is the order on the site.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/content/projects" className="font-sans text-[0.75rem] text-stone-500 underline-offset-4 hover:text-charcoal hover:underline">
            Portfolio headings &amp; categories
          </Link>
          <label className="flex items-center gap-2 border border-charcoal/20 bg-white px-3 py-2">
            <span className="sr-only">Search projects</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects…"
              className="w-40 border-0 bg-transparent font-sans text-[0.8125rem] text-charcoal outline-none placeholder:text-stone-400 sm:w-56"
            />
          </label>
          <Button tone="primary" onClick={addProject}>
            Add a project
          </Button>
        </div>
      </header>

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

      {items.length === 0 ? (
        <InlineNotice>
          There are no projects yet. Add the first one — it stays a draft until you publish it, so nothing appears on the
          public site by accident.
        </InlineNotice>
      ) : null}

      <div className="space-y-3">
        {visible.filter(matches).map((project) => {
          const index = items.findIndex((item) => item.slug === project.slug)
          return (
            <div
              key={project.slug}
              onDragOver={(event) => {
                event.preventDefault()
                setOverSlug(project.slug)
              }}
              onDrop={(event) => {
                event.preventDefault()
                const from = dragFrom.current
                dragFrom.current = null
                setDragSlug(null)
                setOverSlug(null)
                if (!from || from === project.slug) return
                const fromIndex = items.findIndex((item) => item.slug === from)
                const toIndex = items.findIndex((item) => item.slug === project.slug)
                if (fromIndex < 0 || toIndex < 0) return
                const next = [...items]
                const [moved] = next.splice(fromIndex, 1)
                next.splice(toIndex, 0, moved)
                writeItems(next)
              }}
              className={
                'flex flex-wrap items-center gap-4 border bg-white p-4 transition-colors ' +
                (overSlug === project.slug && dragSlug !== null && dragSlug !== project.slug
                  ? 'border-bronze ring-1 ring-bronze'
                  : 'border-charcoal/12')
              }
            >
              <span
                aria-hidden="true"
                draggable
                onDragStart={(event) => {
                  dragFrom.current = project.slug
                  setDragSlug(project.slug)
                  event.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnd={() => {
                  dragFrom.current = null
                  setDragSlug(null)
                  setOverSlug(null)
                }}
                title="Drag to change the order they appear in"
                className="cursor-grab select-none border border-charcoal/15 px-2 py-1.5 font-sans text-[0.75rem] leading-none text-stone-500 active:cursor-grabbing"
              >
                ⠿
              </span>
              <div className="h-20 w-28 shrink-0 overflow-hidden border border-charcoal/10 bg-stone-100">
                {project.cover?.src ? (
                  <img src={project.cover.src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-sans text-[0.6875rem] text-stone-400">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-[12rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-[1.25rem] leading-snug text-charcoal">{project.title || 'Untitled'}</h2>
                  {project.status === 'published' ? <Badge tone="live">Published</Badge> : <Badge tone="draft">Draft</Badge>}
                  {project.isPlaceholder ? <Badge tone="placeholder">Placeholder</Badge> : null}
                </div>
                <p className="mt-1.5 font-sans text-[0.8125rem] text-stone-600">
                  {project.projectType || 'Project type not set'}
                  {project.location ? ` · ${project.location}` : ' · Location not set'}
                </p>
                <p className="mt-1 font-mono text-[0.6875rem] text-stone-400">/projects/{project.slug}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => move(index, -1)} disabled={index <= 0} title="Move earlier">
                  ↑
                </Button>
                <Button onClick={() => move(index, 1)} disabled={index === items.length - 1} title="Move later">
                  ↓
                </Button>
                <Button onClick={() => toggleStatus(project)}>
                  {project.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <Link to={`/admin/projects/${project.slug}`}>
                  <Button tone="primary">Edit</Button>
                </Link>
                <Button onClick={() => duplicate(project)}>Duplicate</Button>
                <Button tone="danger" onClick={() => remove(project)}>
                  Delete
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {projects.categories.length > 0 ? (
        <Card title="Categories" description="Used by the filter buttons on the portfolio page. Edit them under page content → Projects.">
          <div className="flex flex-wrap gap-2">
            {projects.categories.map((category) => (
              <span key={category.key} className="border border-charcoal/15 px-3 py-1.5 font-sans text-[0.75rem] text-stone-600">
                {category.label}
                <span className="ml-2 font-mono text-[0.6875rem] text-stone-400">{category.key}</span>
              </span>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}

export { slugify }
