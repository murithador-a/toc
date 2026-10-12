import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { config, paths } from './lib/config.js'
import { adminConfigured, requireSameOrigin } from './lib/auth.js'
import { apiCors, assetCors } from './lib/cors.js'
import { authRouter, setCredentialLimiter, setResetLimiter } from './routes/auth.js'
import { adminContentRouter, publicContentRouter } from './routes/content.js'
import { uploadsRouter } from './routes/uploads.js'
import { adminSubmissionsRouter, publicSubmissionsRouter } from './routes/submissions.js'
import { rateLimit } from './lib/rateLimit.js'

const app = express()
app.disable('x-powered-by')
if (config.trustProxy) app.set('trust proxy', 1)

/* ------------------------------------------------------------- security */

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  // Framing: allowed by default so the site and its admin can be demonstrated
  // inside a preview panel or a client's own page (see EMBEDDABLE in
  // server/lib/config.js). Set EMBEDDABLE=false to pin the admin — and only the
  // admin, the surface that holds a session — against being framed.
  if (!config.embeddable && req.path.startsWith('/admin')) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  }
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  // The API never returns executable content, so a hard CSP is safe here.
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; form-action 'none'")
  }
  next()
})

// Answers CORS preflights before anything else looks at the request.
app.use(apiCors)

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false, limit: '64kb' }))
app.use(requireSameOrigin)

/* -------------------------------------------------------------- rate limiting */

/**
 * Credential endpoints only. It is deliberately NOT applied to GET /api/auth/session:
 * every admin page load asks whether it is signed in, and counting those against
 * the same budget as password attempts would lock a legitimate administrator out
 * of their own dashboard after a few refreshes.
 */
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, message: 'Too many password attempts from this connection.' })
/**
 * Forgotten-password traffic gets its own budget. Someone locked out of their own
 * site should not be blocked because a password was mistyped twenty times
 * elsewhere on this connection — and the code itself is already single-use,
 * expiring and limited to five guesses.
 */
const resetLimiter = rateLimit({ windowMs: 15 * 60_000, max: 12, message: 'Too many reset requests from this connection.' })
const submitLimiter = rateLimit({ windowMs: 10 * 60_000, max: 12, message: 'Too many submissions from this connection. Please try again shortly or use WhatsApp.' })
const writeLimiter = rateLimit({ windowMs: 60_000, max: 120 })

/* ------------------------------------------------------------------- routes */

// Hand the credential limiter to the auth router, then mount it plainly.
setCredentialLimiter(loginLimiter)
setResetLimiter(resetLimiter)
app.use('/api/auth', authRouter)
app.use('/api/content', publicContentRouter)
app.use('/api/submissions', submitLimiter, publicSubmissionsRouter)
app.use('/api/admin/content', writeLimiter, adminContentRouter)
app.use('/api/admin/uploads', writeLimiter, uploadsRouter)
app.use('/api/admin/submissions', writeLimiter, adminSubmissionsRouter)

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    adminConfigured: adminConfigured(),
    contentFile: path.relative(process.cwd(), config.contentFile),
    uptimeSeconds: Math.round(process.uptime()),
  })
})

// Uploaded images: long-lived immutable filenames, served with nosniff.
// Public static files are cross-origin readable so the built site can be shown
// inside a sandboxed preview frame.
app.use(assetCors)

app.use(
  '/uploads',
  express.static(config.uploadsDir, {
    maxAge: '30d',
    immutable: true,
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.setHeader('Content-Disposition', 'inline'),
  }),
)

/* ------------------------------------------------- static site + SPA fallback */

if (fs.existsSync(config.distDir)) {
  app.use(express.static(config.distDir, { maxAge: '1h', index: false, dotfiles: 'deny' }))
  app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => {
    res.sendFile(path.join(config.distDir, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('text/plain')
      .send('API is running. Build the site with `npm run build`, then serve from this process.\n')
  })
}

/* ------------------------------------------------------------------ errors */

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND', path: req.path })
})

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, _next) => {
  console.error('[error]', error)
  if (res.headersSent) return
  res.status(error.status || 500).json({
    error: config.isProduction ? 'Something went wrong on the server.' : error.message,
    code: error.code || 'SERVER_ERROR',
  })
})

fs.mkdirSync(paths.backups, { recursive: true })
fs.mkdirSync(config.uploadsDir, { recursive: true })

app.listen(config.port, config.host, () => {
  const url = `http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`
  console.log(`[server] TOC API listening on ${url}`)
  console.log(`[server] content file: ${config.contentFile}`)
  console.log(
    adminConfigured()
      ? '[server] admin: password configured — sign in at /admin'
      : '[server] admin: NO PASSWORD SET. Visit /admin to create one (first-run setup).',
  )
  if (!config.isProduction && !process.env.SESSION_SECRET) {
    console.log('[server] note: SESSION_SECRET not set — sessions are derived from the stored credential.')
  }
})

export default app
