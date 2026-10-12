/**
 * Integration status.
 * ---------------------------------------------------------------------------
 * Two independent things are detected at runtime:
 *
 *  1. The built-in API (server/index.js). When it is reachable, forms deliver to
 *     it and the admin area is available. When it is not — a plain static
 *     deployment — everything falls back to the documented WhatsApp hand-off.
 *  2. Optional external endpoints from Vite environment variables. These let an
 *     existing form service or Google Maps key be slotted in without code
 *     changes. Non-HTTPS values are ignored.
 *
 * No secrets belong in this file: VITE_ variables are compiled into the client
 * bundle and are public.
 */

const read = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const requireHttps = (value: string): string => {
  if (!value) return ''
  if (/^https:\/\//i.test(value)) return value
  if (import.meta.env.DEV) console.warn('[TOC] Ignoring non-HTTPS endpoint from environment:', value)
  return ''
}

const env = import.meta.env

export const integration = {
  siteUrl: read(env.VITE_SITE_URL) || 'https://www.tocluxuryconstructions.com',
  /** External overrides — optional */
  inquiryEndpoint: requireHttps(read(env.VITE_INQUIRY_ENDPOINT)),
  consultationEndpoint: requireHttps(read(env.VITE_CONSULTATION_ENDPOINT)) || requireHttps(read(env.VITE_INQUIRY_ENDPOINT)),
  uploadEndpoint: requireHttps(read(env.VITE_INQUIRY_UPLOAD_ENDPOINT)),
  googleMapsEmbedKey: read(env.VITE_GOOGLE_MAPS_EMBED_KEY),
}

/**
 * Set by ContentProvider once /api/content has answered. Until then forms treat
 * the visitor as being on a static deployment, which is the safe assumption.
 */
let apiAvailable = false

export const setApiAvailable = (value: boolean): void => {
  apiAvailable = value
}

export const isApiAvailable = (): boolean => apiAvailable

/** Endpoint the inquiry form should post to, or '' when only WhatsApp is possible. */
export const inquiryDestination = (): string => integration.inquiryEndpoint || (apiAvailable ? '/api/submissions/inquiry' : '')
export const consultationDestination = (): string =>
  integration.consultationEndpoint || (apiAvailable ? '/api/submissions/consultation' : '')

/** Server-side attachment endpoint (admin uploads are separate and authenticated). */
export const uploadDestination = (): string => integration.uploadEndpoint

export const configured = {
  get inquiry() {
    return Boolean(inquiryDestination())
  },
  get consultation() {
    return Boolean(consultationDestination())
  },
  get uploads() {
    return Boolean(uploadDestination())
  },
  get googleMaps() {
    return Boolean(integration.googleMapsEmbedKey)
  },
}

export const integrationSummary = (): string => {
  if (configured.inquiry || configured.consultation) {
    return 'Inquiry delivery is configured: submissions are stored by the site backend and appear in the admin inbox.'
  }
  return 'No inquiry delivery is configured: the forms validate input, then hand the visitor to WhatsApp with their details pre-filled. Nothing is transmitted or stored.'
}
