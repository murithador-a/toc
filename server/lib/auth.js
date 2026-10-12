import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config, paths } from './config.js'
import { storageFailure } from './store.js'

/**
 * Admin authentication.
 * ---------------------------------------------------------------------------
 * • Password storage: scrypt with a per-credential random salt (no plaintext).
 * • Session: HMAC-signed, httpOnly cookie with an expiry. No server-side session
 *   store to lose, and nothing sensitive inside the cookie.
 * • CSRF: SameSite=Strict + an Origin check on every mutating request + a
 *   double-submit token the admin UI mirrors into a header.
 * • Brute force: login attempts are counted per IP and locked out.
 */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 }
const COOKIE = 'toc_session'
const CSRF_COOKIE = 'toc_csrf'
/**
 * The same signed session value can also be presented in this header.
 *
 * Why it exists: a browser that will not keep cookies — a sandboxed preview
 * frame, a third-party embed, or a visitor with cookies switched off — could
 * otherwise never administer the site. The cookie remains the primary and
 * preferred mechanism (it is httpOnly, so scripts cannot read it); the header is
 * a fallback the admin UI uses only when the cookie does not survive. A
 * cross-site request cannot set this header without a CORS preflight, which this
 * server never approves.
 */
const TOKEN_HEADER = 'x-admin-token'

// ---------------------------------------------------------------- passwords

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, SCRYPT.keylen, SCRYPT).toString('hex')
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt}$${derived}`
}

export const verifyPassword = (password, stored) => {
  try {
    const [scheme, N, r, p, salt, expected] = stored.split('$')
    if (scheme !== 'scrypt') return false
    const derived = crypto.scryptSync(password, salt, expected.length / 2, {
      N: Number(N), r: Number(r), p: Number(p), maxmem: 128 * 1024 * 1024,
    }).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

/** Credential source priority: env hash → env plaintext (hashed at boot) → auth.json */
const readAuthFile = () => {
  try {
    if (!fs.existsSync(paths.auth)) return null
    return JSON.parse(fs.readFileSync(paths.auth, 'utf8'))
  } catch {
    return null
  }
}

export const adminConfigured = () => Boolean(config.adminPasswordHash || config.adminPassword || readAuthFile()?.passwordHash)

/**
 * ADMIN_PASSWORD is convenient for a first deployment, but a bare string compare
 * would make guessing cheap. Hash it once at boot and verify against the scrypt
 * hash instead, so both credential sources cost the same to attack and the
 * plaintext never lingers in memory as a comparable value.
 */
const envPasswordHash = config.adminPassword ? hashPassword(config.adminPassword) : ''

export const verifyAdminPassword = (password) => {
  if (!password) return false
  if (config.adminPasswordHash) return verifyPassword(password, config.adminPasswordHash)
  if (envPasswordHash) return verifyPassword(password, envPasswordHash)
  const file = readAuthFile()
  if (!file?.passwordHash) return false
  return verifyPassword(password, file.passwordHash)
}

/**
 * The account record.
 *
 * `auth.json` holds the password hash AND the recovery address. Everything that
 * writes to it goes through writeAccount(), which merges rather than replaces —
 * setting a password must not wipe the address, and vice versa.
 */
export const readAccount = () => {
  const file = readAuthFile() ?? {}
  return {
    email: typeof file.email === 'string' ? file.email : '',
    emailUpdatedAt: typeof file.emailUpdatedAt === 'string' ? file.emailUpdatedAt : null,
    passwordChangedAt: typeof file.passwordChangedAt === 'string' ? file.passwordChangedAt : null,
    passwordManagedByEnv: Boolean(config.adminPasswordHash || config.adminPassword),
    /** True when the credential lives in auth.json (so the UI can change it) */
    hasStoredPassword: typeof file.passwordHash === 'string' && file.passwordHash.length > 0,
  }
}

export const writeAccount = (patch) => {
  const current = readAuthFile() ?? {}
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
  try {
    fs.mkdirSync(path.dirname(paths.auth), { recursive: true })
    fs.writeFileSync(paths.auth, JSON.stringify(next, null, 2), { mode: 0o600 })
  } catch (error) {
    // The administrator needs to know *why* their password or recovery address
    // will not stick, not see an EACCES.
    throw storageFailure('The account change', paths.auth, error)
  }
  // `mode` above only applies when the file is created; re-assert it so an
  // existing file can never be left group- or world-readable.
  try {
    fs.chmodSync(paths.auth, 0o600)
  } catch {
    /* best effort on filesystems without POSIX modes */
  }
  return next
}

/** Writes credentials to server/data/auth.json (gitignored). */
export const saveAdminPassword = (password) => {
  writeAccount({ passwordHash: hashPassword(password), passwordChangedAt: new Date().toISOString() })
  return readAccount()
}

/** Recovery address used for password-reset mail. Never published on the site. */
export const saveAdminEmail = (email) => {
  writeAccount({ email, emailUpdatedAt: new Date().toISOString() })
  return readAccount()
}

/** Shown back to the signed-in administrator, never to anyone else. */
export const maskEmail = (email) => {
  const [name, domain] = String(email || '').split('@')
  if (!name || !domain) return ''
  const head = name.slice(0, 1)
  return `${head}${'•'.repeat(Math.max(2, Math.min(6, name.length - 1)))}@${domain}`
}

// ----------------------------------------------------------------- sessions

const secret = () => {
  if (config.sessionSecret) return config.sessionSecret
  // Derive a stable secret from the credential store so sessions survive a
  // restart in development. Production should always set SESSION_SECRET.
  const stored = readAuthFile()?.passwordHash || config.adminPasswordHash || envPasswordHash || 'toc-dev'
  return crypto.createHash('sha256').update(`toc-session:${stored}`).digest('hex')
}

const sign = (value) => crypto.createHmac('sha256', secret()).update(value).digest('base64url')

export const issueSession = (res) => {
  const payload = JSON.stringify({ sub: 'admin', exp: Date.now() + config.sessionHours * 3600_000 })
  const body = Buffer.from(payload).toString('base64url')
  const token = `${body}.${sign(body)}`
  const csrf = crypto.randomBytes(24).toString('base64url')

  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProduction,
    maxAge: config.sessionHours * 3600_000,
    path: '/',
  })
  // Readable by the admin UI only so it can echo it back in a header.
  res.cookie(CSRF_COOKIE, csrf, {
    httpOnly: false,
    sameSite: 'strict',
    secure: config.isProduction,
    maxAge: config.sessionHours * 3600_000,
    path: '/',
  })
  return { csrfToken: csrf, token }
}

export const clearSession = (res) => {
  res.clearCookie(COOKIE, { path: '/' })
  res.clearCookie(CSRF_COOKIE, { path: '/' })
}

const parseCookies = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=')
        return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
      }),
  )

/** True when the session arrived in the header rather than the cookie. */
export const usingHeaderToken = (req) => {
  const header = req.headers[TOKEN_HEADER]
  return typeof header === 'string' && header.length > 0
}

export const readSession = (req) => {
  const header = req.headers[TOKEN_HEADER]
  const token =
    (typeof header === 'string' && header.length > 0 ? header : '') || parseCookies(req.headers.cookie)[COOKIE]
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = sign(body)
  if (expected.length !== signature.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload?.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export const csrfFromRequest = (req) => parseCookies(req.headers.cookie)[CSRF_COOKIE] || ''

// ------------------------------------------------------------- brute force

const attempts = new Map()
const WINDOW_MS = 15 * 60_000
const MAX_ATTEMPTS = 6

export const loginBlocked = (ip) => {
  const record = attempts.get(ip)
  if (!record) return false
  if (Date.now() - record.first > WINDOW_MS) {
    attempts.delete(ip)
    return false
  }
  return record.count >= MAX_ATTEMPTS
}

export const recordFailedLogin = (ip) => {
  const record = attempts.get(ip)
  if (!record || Date.now() - record.first > WINDOW_MS) attempts.set(ip, { first: Date.now(), count: 1 })
  else record.count += 1
}

export const clearFailedLogins = (ip) => attempts.delete(ip)

export const loginAttemptsRemaining = (ip) => Math.max(0, MAX_ATTEMPTS - (attempts.get(ip)?.count ?? 0))

// ------------------------------------------------------------- middleware

export const requireAdmin = (req, res, next) => {
  if (!readSession(req)) {
    res.status(401).json({ error: 'Not signed in', code: 'UNAUTHENTICATED' })
    return
  }
  next()
}

/**
 * Blocks genuinely cross-site writes. SameSite=Strict already stops the browser
 * attaching the session cookie to a request from another site, and the
 * double-submit token (or the bearer header) is the second lock, so this is the
 * belt-and-braces check.
 *
 * Two situations must be allowed through, or the admin breaks for real users:
 *
 *  - `Origin: null` — an opaque origin. A sandboxed preview frame, an embedded
 *    panel or a `file://` page reports itself this way. Nothing there can read
 *    our cookies (SameSite=Strict) or our responses (no CORS headers are ever
 *    sent), so it gains no privilege: writes from it must still present either
 *    the double-submit token or the bearer header.
 *  - A host that matches except for the port — the usual shape when a dev,
 *    staging or preview proxy forwards requests to the API with its own Host
 *    header (and with `changeOrigin` rewriting it). Cookie sessions there still
 *    owe the double-submit token, which only a page on our own origin can read.
 */
export const requireSameOrigin = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next()
  const origin = req.headers.origin
  if (!origin) return next() // same-origin form posts and non-browser clients
  if (origin === 'null') return next() // opaque origin — see above
  const host = req.headers['x-forwarded-host'] || req.headers.host
  let parsed
  try {
    parsed = new URL(origin)
  } catch {
    res.status(403).json({ error: 'Invalid origin', code: 'BAD_ORIGIN' })
    return
  }
  const sameHost = parsed.host === host
  const hostName = String(host || '').split(':')[0]
  const sameHostName = hostName.length > 0 && parsed.hostname === hostName
  if (!sameHost && !sameHostName) {
    res.status(403).json({ error: 'Cross-origin write blocked', code: 'BAD_ORIGIN' })
    return
  }
  next()
}

/**
 * Double-submit token check — only for authenticated writes.
 *
 * A session presented in the header skips it: the header cannot be set by a
 * cross-site form, image or anchor, and any attempt by script on another origin
 * triggers a preflight this server does not answer. Cookie sessions still carry
 * the full check, because a cookie *can* be attached automatically.
 */
export const requireCsrf = (req, res, next) => {
  if (usingHeaderToken(req)) {
    next()
    return
  }
  const cookieToken = csrfFromRequest(req)
  const headerToken = req.headers['x-csrf-token']
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: 'Missing or invalid CSRF token', code: 'BAD_CSRF' })
    return
  }
  next()
}
