import type { ContentImage, ProjectItem } from '../../content/types'

/** A project as the editor works on it, with the media fields spelled out. */
export type AdminProject = ProjectItem

const blankImage = (): ContentImage => ({ src: '', alt: '', caption: '' })

/**
 * A new, empty project.
 *
 * `isPlaceholder` is false: an entry created here is the company's own record,
 * so it must not carry the “placeholder” disclosure that the seeded layout
 * entries have. `status` is draft so nothing reaches the site until it is
 * published deliberately.
 */
export const emptyProject = (slug: string, order: number, category = ''): AdminProject => ({
  slug,
  title: 'New project',
  // The server rejects a category that is not one of the defined ones, so a new
  // entry takes the first category the site actually offers unless told otherwise.
  category,
  projectType: '',
  status: 'draft',
  isPlaceholder: false,
  location: '',
  yearCompleted: '',
  client: '',
  summary: '',
  description: [],
  scope: [],
  cover: blankImage(),
  gallery: [],
  order,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export { blankImage }
