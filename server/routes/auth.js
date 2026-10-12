import { Router } from 'express'
import {
  adminConfigured,
  clearFailedLogins,
  clearSession,
  issueSession,
  loginAttemptsRemaining,
  loginBlocked,
  maskEmail,
  readAccount,
  readSession,
  recordFailedLogin,
  requireAdmin,
  requireCsrf,
  saveAdminEmail,
  saveAdminPassword,
  verifyAdminPassword,
} from '../lib/auth.js'
import { createReset, discardReset, resetStatus, verifyResetCode } from '../lib/reset.js'
import { mailConfigured, mailTransport, sendResetEmail } from '../lib/mail.js'
import { config } from '../lib/config.js'

export const authRouter = Router()

/**
 * Brute-force limiting for the endpoints that check a password.
 *
 * index.js hands the limiter in through setCredentialLimiter() rather than
 * mounting it on the whole router, so that GET /api/auth/session — which the
 * admin UI calls on every page load — does not consume the same budget as a
 * password attempt.
 */
let credentialLimiter = (_req, _res, next) => next()

let resetLimiter = (_req, _res, next) => next()

export const setCredentialLimiter = (limiter) => {
  credentialLimiter = limiter
}

/** Password-reset traffic has its own allowance — see index.js. */
export const setResetLimiter = (limiter) => {
  resetLimiter = limiter
}

const limited = (handler) => (req, res, next) => credentialLimiter(req, res, () => handler(req, res, next))
const resetLimited = (handler) => (req, res, next) => resetLimiter(req, res, () => handler(req, res, next))

const clientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown'

authRouter.get('/session', (req, res) => {
  const session = readSession(req)
  const account = readAccount()
  res.json({
    configured: adminConfigured(),
    signedIn: Boolean(session),
    expiresAt: session ? new Date(session.exp).toISOString() : null,
    /**
     * Whether the sign-in screen should offer "Forgotten your password?".
     * The address itself is never sent to a signed-out caller — only whether one
     * is on file and how a reset would be delivered.
     */
    reset: {
      available: !account.passwordManagedByEnv,
      hasEmail: Boolean(account.email),
      transport: mailTransport(),
      minutes: config.resetMinutes,
    },
  })
})

authRouter.post(
  '/login',
  limited((req, res) => {
    const ip = clientIp(req)

    if (!adminConfigured()) {
      res.status(503).json({
        error: 'No admin password has been set for this deployment.',
        code: 'NOT_CONFIGURED',
      })
      return
    }
    if (loginBlocked(ip)) {
      res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' })
      return
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!verifyAdminPassword(password)) {
      recordFailedLogin(ip)
      res.status(401).json({
        error: 'That password is not correct.',
        code: 'BAD_CREDENTIALS',
        attemptsRemaining: loginAttemptsRemaining(ip),
      })
      return
    }

    clearFailedLogins(ip)
    const { csrfToken, token } = issueSession(res)
    // `token` is for clients that cannot keep cookies (an embedded preview, for
    // instance). The admin UI stores it for the life of the tab and never sends
    // it anywhere except back to this server.
    res.json({ signedIn: true, csrfToken, token })
  }),
)

authRouter.post('/logout', (req, res) => {
  clearSession(res)
  res.json({ signedIn: false })
})

/**
 * First-run setup. Only reachable while no password exists, so a fresh
 * deployment cannot be left with an open admin area. Once a password is set this
 * endpoint always refuses — use /password to change it.
 */
authRouter.post(
  '/setup',
  limited((req, res) => {
    if (adminConfigured()) {
      res.status(409).json({ error: 'An admin password is already configured.', code: 'ALREADY_CONFIGURED' })
      return
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (password.length < 10) {
      res.status(400).json({ error: 'Choose a password of at least 10 characters.', code: 'WEAK_PASSWORD' })
      return
    }
    saveAdminPassword(password)
    const { csrfToken, token } = issueSession(res)
    console.log('[auth] Admin password created via first-run setup.')
    res.status(201).json({ signedIn: true, csrfToken, token })
  }),
)

/** The administrator's own account: recovery address and password. */
authRouter.get('/account', requireAdmin, (_req, res) => {
  const account = readAccount()
  res.json({
    email: account.email,
    maskedEmail: maskEmail(account.email),
    emailUpdatedAt: account.emailUpdatedAt,
    passwordChangedAt: account.passwordChangedAt,
    passwordManagedByEnv: account.passwordManagedByEnv,
    mailConfigured: mailConfigured(),
    mailTransport: mailTransport(),
    reset: resetStatus(),
    resetMinutes: config.resetMinutes,
  })
})

/**
 * Change the recovery address. The current password is required — an unattended
 * laptop should not be able to redirect someone else's password reset.
 */
authRouter.post(
  '/account/email',
  requireAdmin,
  requireCsrf,
  limited((req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    const raw = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
    if (!verifyAdminPassword(password)) {
      res.status(401).json({ error: 'Your current password is not correct.', code: 'BAD_CREDENTIALS' })
      return
    }
    if (raw && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) {
      res.status(400).json({ error: 'That does not look like an email address.', code: 'INVALID_EMAIL' })
      return
    }
    const account = saveAdminEmail(raw)
    console.log(raw ? '[auth] Recovery email updated.' : '[auth] Recovery email cleared.')
    res.json({ ok: true, email: account.email, maskedEmail: maskEmail(account.email), emailUpdatedAt: account.emailUpdatedAt })
  }),
)

/**
 * Ask for a reset code.
 *
 * Deliberately unauthenticated — this is the "I cannot get in" path. It never
 * says whether an address is on file: it reports how the code was delivered, so
 * the screen can tell the truth about it either way.
 */
authRouter.post(
  '/reset/request',
  resetLimited(async (req, res) => {
    const account = readAccount()
    if (!adminConfigured()) {
      res.status(503).json({ error: 'No admin password has been set for this deployment.', code: 'NOT_CONFIGURED' })
      return
    }
    if (account.passwordManagedByEnv) {
      res.status(409).json({
        error: 'The password on this deployment is set by an environment variable, so it can only be changed there.',
        code: 'ENV_MANAGED',
      })
      return
    }
    const ip = clientIp(req)
    if (loginBlocked(ip)) {
      res.status(429).json({
        error: 'Too many failed sign-ins from this connection. Try again in about 15 minutes.',
        code: 'RATE_LIMITED',
      })
      return
    }

    const byEmail = mailConfigured() && Boolean(account.email)
    const { code, expiresAt } = createReset({ deliveredByEmail: byEmail })
    let delivery = 'file'
    let note = ''

    if (byEmail) {
      const siteUrl = `${req.protocol || 'http'}://${req.headers.host || 'localhost'}`
      const sent = await sendResetEmail({ to: account.email, code, minutes: config.resetMinutes, siteUrl })
      if (sent.delivered) {
        delivery = 'email'
        note = `Sent to ${maskEmail(account.email)}.`
      } else {
        // The transport was configured but refused: fall back to the file, and
        // say exactly what happened instead of implying an email went out.
        delivery = 'file'
        note = `Email could not be sent (${sent.reason}).`
        console.warn('[auth] Reset email failed:', sent.reason, sent.message ?? '')
      }
    } else if (!account.email) {
      note = 'No recovery address is set on this account.'
    } else {
      note = 'No mail is configured on this server.'
    }

    console.log(
      delivery === 'file'
        ? '[auth] Password reset code created. No mail configured — it is in server/data/reset-code.txt (mode 600).'
        : '[auth] Password reset code created and emailed.',
    )
    res.json({
      ok: true,
      delivery,
      note,
      expiresAt,
      minutes: config.resetMinutes,
      fileHint: delivery === 'file' ? 'server/data/reset-code.txt' : '',
    })
  }),
)

/** Finish the reset: the code plus the new password. */
authRouter.post(
  '/reset/confirm',
  resetLimited((req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code : ''
    const next = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    const account = readAccount()

    if (account.passwordManagedByEnv) {
      res.status(409).json({
        error: 'The password on this deployment is set by an environment variable, so it can only be changed there.',
        code: 'ENV_MANAGED',
      })
      return
    }
    if (!code) {
      res.status(400).json({ error: 'Enter the reset code.', code: 'MISSING_CODE' })
      return
    }
    if (next.length < 10) {
      res.status(400).json({ error: 'Choose a password of at least 10 characters.', code: 'WEAK_PASSWORD' })
      return
    }

    const checked = verifyResetCode(code)
    if (!checked.ok) {
      const messages = {
        none: 'There is no reset in progress. Ask for a new code.',
        expired: 'That code has expired. Ask for a new one.',
        'too-many': 'Too many wrong codes. Ask for a new one.',
        wrong: 'That code is not right.',
      }
      res.status(400).json({
        error: messages[checked.reason] ?? 'That code is not right.',
        code: checked.reason === 'wrong' ? 'BAD_CODE' : 'NO_RESET',
        attemptsLeft: checked.attemptsLeft ?? 0,
      })
      return
    }

    saveAdminPassword(next)
    discardReset()
    clearSession(res)
    clearFailedLogins(clientIp(req))
    console.log('[auth] Password reset with a one-time code. All sessions were signed out.')
    res.json({ changed: true, signedIn: false })
  }),
)

authRouter.post(
  '/password',
  requireAdmin,
  requireCsrf,
  limited((req, res) => {
    const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    const next = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''

    // An env-configured password cannot be changed from the UI — it must be
    // changed where it is set (ADMIN_PASSWORD / ADMIN_PASSWORD_HASH).
    if (process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH) {
      res.status(409).json({
        error: 'The password is set by an environment variable on this deployment. Change it there.',
        code: 'ENV_MANAGED',
      })
      return
    }
    if (!verifyAdminPassword(current)) {
      res.status(401).json({ error: 'Your current password is not correct.', code: 'BAD_CREDENTIALS' })
      return
    }
    if (next.length < 10) {
      res.status(400).json({ error: 'Choose a password of at least 10 characters.', code: 'WEAK_PASSWORD' })
      return
    }
    saveAdminPassword(next)
    clearSession(res)
    res.json({ changed: true, signedIn: false })
  }),
)
