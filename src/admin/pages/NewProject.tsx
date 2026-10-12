import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../AdminProvider'
import { emptyProject, type AdminProject } from './projectModel'

/**
 * /admin/projects/new — creates an empty draft and opens its editor.
 *
 * Doing it on arrival (rather than in a click handler) means the address can be
 * bookmarked and shared, and a reload lands in the same place.
 */
export function NewProject() {
  const { content, update } = useAdmin()
  const navigate = useNavigate()
  const created = useRef(false)

  useEffect(() => {
    if (created.current || !content) return
    created.current = true

    const projects = content.projects as { items: AdminProject[] }
    const taken = new Set(projects.items.map((item) => item.slug))
    let slug = 'new-project'
    let counter = 2
    while (taken.has(slug)) {
      slug = `new-project-${counter}`
      counter += 1
    }

    update('projects' as never, (draft) => {
      const record = draft as { items: AdminProject[] }
      return { ...record, items: [...record.items, emptyProject(slug, record.items.length, (content.projects as { categories?: { key: string }[] }).categories?.[0]?.key ?? '')] } as never
    })
    navigate(`/admin/projects/${slug}`, { replace: true })
  }, [content, navigate, update])

  if (!content) return <p className="font-sans text-[0.875rem] text-stone-500">Creating the project…</p>
  return <p className="font-sans text-[0.875rem] text-stone-500">Creating the project…</p>
}
