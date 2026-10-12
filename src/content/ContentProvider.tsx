import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultContent } from './defaults'
import { interpolateContent } from './interpolate'
import { getContent, setContentSnapshot } from './store'
import { setApiAvailable } from '../lib/integrations'
import type { SiteContent } from './types'
import { ContentContext, type ContentState } from './context'
import { installPreviewBridge, isPreviewFrame } from './previewBridge'

const normalise = (content: SiteContent): SiteContent => {
  const resolved = interpolateContent(content)
  setContentSnapshot(resolved)
  return resolved
}

// Seed the module snapshot immediately so helpers used during the first render
// (WhatsApp links, form options) see real values rather than empty strings.
normalise(defaultContent)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(() => getContent())
  const [loading, setLoading] = useState(true)
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/content', {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`Content API responded ${response.status}`)
      const payload = (await response.json()) as { content: SiteContent }
      if (!payload?.content) throw new Error('Content API returned no document')
      setContent(normalise(payload.content))
      setApiAvailable(true)
      setBackendAvailable(true)
      setError(null)
    } catch (cause) {
      // Static deployment, or the API is unavailable: the bundled document is
      // already on screen, so the site simply carries on.
      setApiAvailable(false)
      setBackendAvailable(false)
      setError(cause instanceof Error ? cause.message : 'Content could not be loaded')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * In the admin's visual editor this page is loaded with `?toc-preview=1`.
   * The bridge then takes over: the draft arrives over postMessage, clicks on
   * the page report which field they hit, and the admin can highlight a field.
   * An ordinary visitor never enters this branch.
   */
  useEffect(() => {
    if (!isPreviewFrame()) return undefined
    return installPreviewBridge({ onContent: (draft) => setContent(normalise(draft)) })
  }, [])

  const value = useMemo<ContentState>(
    () => ({ content, loading, backendAvailable, reload: load, error }),
    [content, loading, backendAvailable, load, error],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}
