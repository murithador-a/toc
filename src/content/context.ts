import { createContext, useContext, useMemo } from 'react'
import type { SiteContent } from './types'

/**
 * The content context and its hooks.
 * ---------------------------------------------------------------------------
 * These live apart from <ContentProvider> on purpose: a module that exports both
 * a component and hooks cannot be hot-reloaded by React Fast Refresh, and the
 * fallback (a full module reload) creates a *second* context object — every
 * consumer then throws “must be used inside <ContentProvider>”. Splitting them
 * keeps development stable.
 */

export type ContentState = {
  /** Always populated — starts as the bundled document, replaced by the API copy */
  content: SiteContent
  /** true while the first /api/content request is in flight */
  loading: boolean
  /** false when the site is deployed without the API (static build / API down) */
  backendAvailable: boolean
  /** Re-fetch from the API after a save elsewhere */
  reload: () => Promise<void>
  /** Latest error from a failed content fetch, for diagnostics only */
  error: string | null
}

export const ContentContext = createContext<ContentState | null>(null)

export function useContentState(): ContentState {
  const context = useContext(ContentContext)
  if (!context) throw new Error('useContentState must be used inside <ContentProvider>')
  return context
}

/** Read the whole document. */
export function useContent(): SiteContent {
  return useContentState().content
}

/**
 * Published projects only, in display order — what the public site should show.
 * Draft entries remain visible in the admin.
 */
export function usePublishedProjects() {
  const { projects } = useContent()
  return useMemo(
    () => [...projects.items].filter((project) => project.status === 'published').sort((a, b) => a.order - b.order),
    [projects.items],
  )
}
