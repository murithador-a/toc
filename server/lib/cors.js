/**
 * Cross-origin *read* access for the API — and nothing more.
 *
 * Why it exists: an embedded preview panel, a deploy sandbox or a fully
 * sandboxed frame talks to this API from an opaque or foreign origin. Without
 * these headers the browser refuses to hand the response to the page, so the
 * public site would fall back to its bundled content and nobody could sign in to
 * the admin from that frame at all.
 *
 * Why it is safe:
 *  - `Access-Control-Allow-Origin: *` is sent WITHOUT
 *    `Access-Control-Allow-Credentials`, so a page on another site can never make
 *    the browser attach the session cookie, and cannot read a cookie it cannot
 *    see in the first place.
 *  - Writes stay gated by `requireSameOrigin` (real cross-site origins are still
 *    refused), by the double-submit token for cookie sessions, and by the bearer
 *    header for token sessions — a value only our own code holds.
 *
 * `/uploads/*` deliberately gets no CORS headers: images are subresources, so
 * they render in any frame without them.
 */
const ALLOWED_HEADERS = 'content-type, accept, x-csrf-token, x-admin-token'

export const apiCors = (req, res, next) => {
  if (req.path !== '/api' && !req.path.startsWith('/api/')) return next()
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS)
  res.setHeader('Access-Control-Max-Age', '600')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
}

/**
 * The same reasoning applied to the built site's own files.
 *
 * A page loaded into a sandboxed frame reports its origin as `null`; browsers
 * then treat its module scripts, fonts and stylesheets as cross-origin requests
 * and refuse them without `Access-Control-Allow-Origin`. These are public static
 * files — identical for every visitor — so opening them up costs nothing and
 * lets the site (and the admin inside it) render in an embedded preview.
 */
const ASSET_PREFIXES = ['/assets/', '/fonts/', '/images/', '/logo/']

export const assetCors = (req, res, next) => {
  if (ASSET_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  next()
}
