import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdmin } from '../AdminProvider'
import { Badge, Button, Card, FieldRow, Grid, ImageField, InlineNotice, ListItemShell, TextArea, TextInput, Toggle } from '../ui'
import { slugify } from '../fields'
import { blankImage, type AdminProject } from './projectModel'
import { SectionPreviewLink } from './SectionPreviewLink'

/** Full editor for one portfolio entry. */
export function ProjectEditor() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { content, update, status } = useAdmin()
  const [showSlugWarning, setShowSlugWarning] = useState(false)

  /**
   * Renaming a project changes its address, and the two halves of that change do
   * not land in the same render: the content updates first, the URL a moment
   * later. For that instant the address in the bar matches no project, and the
   * editor would bounce the user back to the list mid-edit. While a rename is in
   * flight the editor holds its ground and shows a holding message instead.
   */
  const renaming = useRef<{ from: string; to: string } | null>(null)
  // Hooks must run on every render — they cannot live below the early returns
  // that show "Loading…" or the rename notice.
  const [galleryDragFrom, setGalleryDragFrom] = useState<number | null>(null)
  const [galleryDragOver, setGalleryDragOver] = useState<number | null>(null)
  const galleryDrag = useRef<number | null>(null)

  const projects = content?.projects as { items: AdminProject[]; categories: { key: string; label: string }[] } | undefined
  const project = projects?.items.find((item) => item.slug === slug)

  useEffect(() => {
    if (!projects) return
    if (project) {
      renaming.current = null
      return
    }
    if (renaming.current) return
    navigate('/admin/projects', { replace: true })
  }, [project, projects, navigate, slug])

  // If the rename never lands (the save was refused, say), do not strand the
  // screen on the holding message.
  useEffect(() => {
    if (!renaming.current) return
    const timer = window.setTimeout(() => {
      renaming.current = null
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [slug, project])

  if (!projects) return <p className="font-sans text-[0.875rem] text-stone-500">Loading…</p>
  if (!project) {
    return (
      <p className="font-sans text-[0.875rem] text-stone-500">
        {renaming.current ? 'Applying the new web address…' : 'That project no longer exists.'}
      </p>
    )
  }

  const categories = projects.categories.length > 0 ? projects.categories : [{ key: 'residential', label: 'Residential' }]

  /** Apply a change to this project only. */
  const patch = (values: Partial<AdminProject>, renameSlug?: string) => {
    update('projects' as never, (draft) => {
      const record = draft as { items: AdminProject[] }
      const next = record.items.map((item) =>
        item.slug === slug
          ? { ...item, ...values, ...(renameSlug ? { slug: renameSlug } : {}), updatedAt: new Date().toISOString() }
          : item,
      )
      return { ...record, items: next } as never
    })
    if (renameSlug && renameSlug !== slug) {
      renaming.current = { from: slug, to: renameSlug }
      navigate(`/admin/projects/${renameSlug}`, { replace: true })
    }
  }

  const gallery = project.gallery ?? []
  const sectionStatus = status.projects ?? 'idle'

  return (
    <div className="space-y-6">
      <nav className="font-sans text-[0.75rem] text-stone-500">
        <Link to="/admin/projects" className="underline-offset-4 hover:text-charcoal hover:underline">
          ← All projects
        </Link>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.25rem] leading-tight text-charcoal">{project.title || 'Untitled project'}</h1>
          <p className="mt-2 font-sans text-[0.8125rem] text-stone-500">
            <span className="font-mono">/projects/{project.slug}</span>
            {project.status === 'published' ? ' · visible on the site' : ' · draft, not shown on the site'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {project.status === 'published' ? <Badge tone="live">Published</Badge> : <Badge tone="draft">Draft</Badge>}
          {project.isPlaceholder ? <Badge tone="placeholder">Placeholder</Badge> : null}
          {project.status === 'published' ? (
            <SectionPreviewLink to={`/projects/${project.slug}`} label="project page" />
          ) : null}
          <Button
            tone="primary"
            onClick={() => patch({ status: project.status === 'published' ? 'draft' : 'published' })}
          >
            {project.status === 'published' ? 'Unpublish draft' : 'Publish'}
          </Button>
        </div>
      </header>

      {sectionStatus === 'error' ? (
        <InlineNotice tone="error">
          The last change was refused by the server. Check the message at the top of the page — usually a required value
          is missing, such as an image description.
        </InlineNotice>
      ) : null}

      {project.isPlaceholder ? (
        <InlineNotice tone="warning">
          This entry is one of the original layout placeholders, so it carries a visible notice and is hidden from search
          engines. Replace its content with a real project, then switch off <strong>layout placeholder</strong> below.
        </InlineNotice>
      ) : null}

      <Card title="The essentials" description="Title, address and how the entry is filed.">
        <Grid>
          <FieldRow label="Title" field="title" help="Shown on the card, the project page and in search results.">
            <TextInput
              value={project.title}
              onChange={(value) => {
                // Follow the title only while the address is still automatic —
                // once it has been set by hand (or once the page has been shared)
                // the address stays put.
                const automatic = project.slug === slugify(project.title) || /^new-project(-\d+)?$/.test(project.slug)
                const wanted = slugify(value)
                const taken = projects.items.some((item) => item.slug === wanted && item.slug !== slug)
                patch({ title: value }, automatic && wanted && !taken ? wanted : undefined)
                setShowSlugWarning(Boolean(automatic && wanted && taken))
              }}
            />
          </FieldRow>
          <FieldRow
            label="Web address"
            field="slug"
            help="Lowercase words separated by hyphens, generated from the title. Changing this changes the project's URL — any link already shared will stop working."
          >
            <TextInput
              value={project.slug}
              onChange={(value) => {
                const wanted = slugify(value)
                const taken = projects.items.some((item) => item.slug === wanted && item.slug !== slug)
                setShowSlugWarning(Boolean(taken))
                if (wanted && !taken) patch({}, wanted)
              }}
            />
          </FieldRow>
          {showSlugWarning ? (
            <div className="sm:col-span-2">
              <InlineNotice tone="warning">That address is already used by another project. Choose a different one.</InlineNotice>
            </div>
          ) : null}
          <FieldRow label="Category" field="category" help="Groups the entry with the filter buttons on the portfolio page.">
            <select
              value={project.category}
              onChange={(event) => patch({ category: event.target.value })}
              className="w-full border border-charcoal/20 bg-white px-3 py-2.5 font-sans text-[0.9375rem] text-charcoal focus:border-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              {categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Project type" field="projectType" help="A short description, e.g. “Four bedroom detached residence”.">
            <TextInput value={project.projectType} onChange={(value) => patch({ projectType: value })} />
          </FieldRow>
          <FieldRow label="Location" field="location" help="Leave empty and the site says “Location to be confirmed” rather than inventing one.">
            <TextInput value={project.location} onChange={(value) => patch({ location: value })} />
          </FieldRow>
          <FieldRow label="Completed" field="yearCompleted" help="Year, or leave empty to say “To be confirmed”.">
            <TextInput value={project.yearCompleted} onChange={(value) => patch({ yearCompleted: value })} />
          </FieldRow>
          <FieldRow label="Client" field="client" help="Optional. Only publish a client name if they have agreed to it.">
            <TextInput value={project.client} onChange={(value) => patch({ client: value })} />
          </FieldRow>
          <FieldRow label="One-line summary" field="summary" wide help="Appears under the title on the card and in search results.">
            <TextArea value={project.summary} onChange={(value) => patch({ summary: value })} rows={2} maxLength={300} />
          </FieldRow>
        </Grid>
      </Card>

      <Card title="Photographs" description="The cover image is used on the portfolio grid and at the top of the project page.">
        <ImageField
          label="Cover photograph"
          field="cover"
          image={project.cover}
          onChange={(next) => patch({ cover: next })}
        />

        <div className="mt-8">
          <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-stone-500">
            Additional photographs
          </p>
          <p className="mt-1.5 font-sans text-[0.8125rem] text-stone-600">
            Shown in a grid beneath the project story. Two to six images work well.
          </p>

          <div className="mt-4 space-y-3">
            {gallery.map((image, index) => (
              <ListItemShell
                key={`${image.src}-${index}`}
                title={image.caption || image.alt || `Photograph ${index + 1}`}
                canMoveUp={index > 0}
                canMoveDown={index < gallery.length - 1}
                onMoveUp={() => {
                  const next = [...gallery]
                  const [moved] = next.splice(index, 1)
                  next.splice(index - 1, 0, moved)
                  patch({ gallery: next })
                }}
                onMoveDown={() => {
                  const next = [...gallery]
                  const [moved] = next.splice(index, 1)
                  next.splice(index + 1, 0, moved)
                  patch({ gallery: next })
                }}
                onRemove={() => patch({ gallery: gallery.filter((_, position) => position !== index) })}
                onDuplicate={() => {
                  const copy = JSON.parse(JSON.stringify(image)) as typeof image
                  if (copy.caption) copy.caption = copy.caption + ' (copy)'
                  patch({ gallery: [...gallery.slice(0, index + 1), copy, ...gallery.slice(index + 1)] })
                }}
                dropTarget={galleryDragOver === index && galleryDragFrom !== null && galleryDragFrom !== index}
                dragHandlers={{
                  onDragStart: (event) => {
                    galleryDrag.current = index
                    setGalleryDragFrom(index)
                    event.dataTransfer.effectAllowed = 'move'
                  },
                  onDragEnd: () => {
                    galleryDrag.current = null
                    setGalleryDragFrom(null)
                    setGalleryDragOver(null)
                  },
                  onDragOver: (event) => {
                    event.preventDefault()
                    setGalleryDragOver(index)
                  },
                  onDrop: (event) => {
                    event.preventDefault()
                    const from = galleryDrag.current
                    galleryDrag.current = null
                    setGalleryDragFrom(null)
                    setGalleryDragOver(null)
                    if (from === null || from === index) return
                    const next = [...gallery]
                    const [moved] = next.splice(from, 1)
                    next.splice(index, 0, moved)
                    patch({ gallery: next })
                  },
                }}
              >
                <ImageField
                  field="gallery"
                  image={image}
                  onChange={(next) => patch({ gallery: gallery.map((entry, position) => (position === index ? next : entry)) })}
                />
              </ListItemShell>
            ))}
          </div>

          <div className="mt-4">
            <Button tone="primary" onClick={() => patch({ gallery: [...gallery, blankImage()] })}>
              Add a photograph
            </Button>
          </div>
        </div>
      </Card>

      <Card title="The story" description="What the project involved. Paragraphs are separated by blank lines.">
        <Grid cols={1}>
          <FieldRow label="Description" field="description" wide help="First paragraph should say what the building is and what TOC was responsible for.">
            <TextArea
              value={(project.description ?? []).join('\n\n')}
              rows={8}
              onChange={(text) =>
                patch({
                  description: text
                    .split(/\n\s*\n/)
                    .map((block) => block.trim())
                    .filter(Boolean),
                })
              }
            />
          </FieldRow>
          <FieldRow label="Scope of works" field="scope" wide help="One item per line, e.g. “Substructure and reinforced concrete frame”.">
            <TextArea
              value={(project.scope ?? []).join('\n')}
              rows={8}
              onChange={(text) =>
                patch({
                  scope: text
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
          </FieldRow>
        </Grid>
      </Card>

      <Card title="Publishing" description="Control what visitors and search engines see.">
        <Grid>
          <div className="sm:col-span-2" data-field="status">
            <Toggle
              checked={project.status === 'published'}
              onChange={(value) => patch({ status: value ? 'published' : 'draft' })}
              label="Published"
              help="Published entries appear in the portfolio grid, have their own page, and are listed for search engines (as long as they are not placeholders)."
            />
          </div>
          <div className="sm:col-span-2" data-field="isPlaceholder">
            <Toggle
              checked={project.isPlaceholder}
              onChange={(value) => patch({ isPlaceholder: value })}
              label="This is a layout placeholder"
              help="Only for demonstration entries that are not real TOC work. It adds a visible notice on the card and page, and keeps the page out of search results. Switch it off once the entry describes a real project."
            />
          </div>
        </Grid>
      </Card>
    </div>
  )
}
