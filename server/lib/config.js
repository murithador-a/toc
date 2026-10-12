import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..', '..')

/** Minimal .env loader (no dependency, no surprises). */
export const loadEnv = (file = path.join(ROOT, '.env')) => {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}
loadEnv()

export const config = {
  port: Number(process.env.PORT || process.env.API_PORT || 8787),
  host: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  isProduction: process.env.NODE_ENV === 'production',

  /** Where uploaded images are written and served from */
  uploadsDir: process.env.UPLOADS_DIR || path.join(ROOT, 'server', 'data', 'uploads'),
  /** All other server state: content store backups, auth, submissions */
  dataDir: process.env.DATA_DIR || path.join(ROOT, 'server', 'data'),
  contentFile: process.env.CONTENT_FILE || path.join(ROOT, 'content', 'site.json'),
  distDir: path.join(ROOT, 'dist'),

  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  sessionHours: Number(process.env.SESSION_HOURS || 12),

  /**
   * Password-reset delivery — both optional, both off by default.
   *
   * With neither set, a reset code is written to server/data/reset-code.txt and
   * the server log says so. Nothing is ever claimed to have been emailed when it
   * has not: the sign-in screen reports exactly how the code was delivered.
   *
   *   SMTP_URL=smtp://user:pass@smtp.example.com:587   (needs nodemailer)
   *   RESET_WEBHOOK_URL=https://…  (POSTs JSON to your own mail relay)
   */
  smtpUrl: process.env.SMTP_URL || '',
  mailFrom: process.env.MAIL_FROM || '',
  resetWebhookUrl: process.env.RESET_WEBHOOK_URL || '',
  resetMinutes: Number(process.env.RESET_MINUTES || 30),

  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 8 * 1024 * 1024),
  trustProxy: process.env.TRUST_PROXY === 'true',

  /**
   * Whether the site may be shown inside a frame belonging to another page.
   *
   * Default: yes. The site and its admin are meant to be demonstrable from a
   * preview panel, a hosting sandbox or a client's own page, and a framed page
   * cannot touch the session cookie (SameSite=Strict) or read a response it was
   * not sent. Set EMBEDDABLE=false to send `X-Frame-Options: SAMEORIGIN` and
   * lock framing off entirely — the sensible choice once the site lives on its
   * real domain and nobody needs to preview it inside anything.
   */
  embeddable: process.env.EMBEDDABLE !== 'false',
}

export const paths = {
  auth: path.join(config.dataDir, 'auth.json'),
  submissions: path.join(config.dataDir, 'submissions.json'),
  backups: path.join(config.dataDir, 'backups'),
}
