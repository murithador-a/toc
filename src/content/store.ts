import { defaultContent } from './defaults'
import type { SiteContent } from './types'

/**
 * Small module-level snapshot of the active content document.
 *
 * React components read content through `useContent()`; non-React helpers
 * (WhatsApp message building, form option lists) read this snapshot so they do
 * not need to be threaded through props.
 */
let snapshot: SiteContent = defaultContent

export const getContent = (): SiteContent => snapshot
export const setContentSnapshot = (content: SiteContent): void => {
  snapshot = content
}
