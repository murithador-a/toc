import raw from '../../content/site.json'
import type { SiteContent } from './types'

/**
 * Bundled fallback content.
 *
 * `content/site.json` is the canonical document — the API writes back to the same
 * file, so this fallback is byte-identical to a freshly seeded server. It exists
 * so the site keeps working as a plain static build with no backend at all
 * (see ContentProvider), and so the very first paint never waits on a request.
 */
export const defaultContent = raw as unknown as SiteContent

export default defaultContent
