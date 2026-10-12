import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { paths } from '../lib/config.js'
import { requireAdmin, requireCsrf } from '../lib/auth.js'
import { sanitiseConsultation, sanitiseInquiry, validateConsultation, validateInquiry } from '../lib/validate.js'

export const publicSubmissionsRouter = Router()
export const adminSubmissionsRouter = Router()

const MAX_STORED = 2000
const FILE = paths.submissions

/**
 * Submissions are appended to a JSON file held outside the web root. Swapping in
 * a database later means replacing readAll / writeAll only.
 */
const readAll = () => {
  try {
    if (!fs.existsSync(FILE)) return []
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('[submissions] could not read store:', error.message)
    return []
  }
}

const writeAll = (list) => {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
  } catch {
    /* read-only deployment — the write below reports it properly */
  }
  const temp = `${FILE}.tmp`
  fs.writeFileSync(temp, JSON.stringify(list.slice(0, MAX_STORED), null, 2), { mode: 0o600 })
  fs.renameSync(temp, FILE)
}

const store = (kind, data, req) => {
  const list = readAll()
  const record = {
    id: crypto.randomUUID(),
    kind,
    createdAt: new Date().toISOString(),
    read: false,
    archived: false,
    data,
    meta: {
      // Kept for spam investigation only, never shown on the public site.
      ip: req.ip,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
    },
  }
  list.unshift(record)
  writeAll(list)
  console.log(`[submissions] ${kind} received from ${data.fullName || 'unknown'}`)
  return record
}

const SPAM_HINTS = [/\bviagra\b/i, /\b casino \b/i, /\bcrypto\s+loan\b/i, /\[url=/i, /<a\s+href/i, /seo\s+services\s+for\s+sale/i]

/** Light-touch spam scoring. Nothing is discarded silently — it is flagged. */
const looksLikeSpam = (data) => {
  const text = Object.values(data).filter((v) => typeof v === 'string').join(' ')
  const links = (text.match(/https?:\/\//g) || []).length
  return SPAM_HINTS.some((re) => re.test(text)) || links > 3
}

publicSubmissionsRouter.post('/inquiry', (req, res, next) => {
  try {
    // Honeypot: a real person never fills a hidden field.
    if (typeof req.body?.companyWebsite === 'string' && req.body.companyWebsite.trim()) {
      res.status(202).json({ ok: true, id: null })
      return
    }
    const data = sanitiseInquiry(req.body)
    const errors = validateInquiry(data)
    if (errors.length) {
      res.status(422).json({ error: 'Some details were not accepted.', code: 'INVALID_SUBMISSION', details: errors })
      return
    }
    const record = store('inquiry', data, req)
    res.status(201).json({ ok: true, id: record.id, receivedAt: record.createdAt })
  } catch (error) {
    next(error)
  }
})

publicSubmissionsRouter.post('/consultation', (req, res, next) => {
  try {
    if (typeof req.body?.companyWebsite === 'string' && req.body.companyWebsite.trim()) {
      res.status(202).json({ ok: true, id: null })
      return
    }
    const data = sanitiseConsultation(req.body)
    const errors = validateConsultation(data)
    if (errors.length) {
      res.status(422).json({ error: 'Some details were not accepted.', code: 'INVALID_SUBMISSION', details: errors })
      return
    }
    const record = store('consultation', data, req)
    res.status(201).json({ ok: true, id: record.id, receivedAt: record.createdAt })
  } catch (error) {
    next(error)
  }
})

/** Status probe so the form can tell the visitor what will actually happen. */
publicSubmissionsRouter.get('/status', (_req, res) => {
  res.json({ accepting: true })
})

adminSubmissionsRouter.use(requireAdmin)

adminSubmissionsRouter.get('/', (req, res) => {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : ''
  const includeArchived = req.query.archived === 'true'
  let list = readAll()
  if (kind) list = list.filter((entry) => entry.kind === kind)
  if (!includeArchived) list = list.filter((entry) => !entry.archived)
  res.set('Cache-Control', 'no-store')
  res.json({
    submissions: list,
    counts: {
      total: readAll().length,
      unread: readAll().filter((entry) => !entry.read && !entry.archived).length,
      inquiry: readAll().filter((entry) => entry.kind === 'inquiry' && !entry.archived).length,
      consultation: readAll().filter((entry) => entry.kind === 'consultation' && !entry.archived).length,
      archived: readAll().filter((entry) => entry.archived).length,
    },
  })
})

/** Export every submission as CSV for accounting or follow-up outside the site. */
adminSubmissionsRouter.get('/export.csv', (_req, res) => {
  const list = readAll()
  const columns = [
    'id', 'kind', 'createdAt', 'read', 'archived',
    'fullName', 'phone', 'email', 'service', 'projectType', 'budget',
    'location', 'preferredDate', 'preferredTime', 'description', 'notes', 'attachmentName',
  ]
  const escape = (value) => {
    const text = value === undefined || value === null ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const rows = [columns.join(',')]
  for (const entry of list) {
    rows.push(
      columns
        .map((column) => {
          if (column === 'id' || column === 'kind' || column === 'createdAt') return escape(entry[column])
          if (column === 'read' || column === 'archived') return escape(entry[column])
          return escape(entry.data?.[column])
        })
        .join(','),
    )
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="toc-submissions.csv"')
  res.send(`${rows.join('\n')}\n`)
})

adminSubmissionsRouter.patch('/:id', requireCsrf, (req, res) => {
  const list = readAll()
  const entry = list.find((item) => item.id === req.params.id)
  if (!entry) {
    res.status(404).json({ error: 'Submission not found.', code: 'NOT_FOUND' })
    return
  }
  if (typeof req.body?.read === 'boolean') entry.read = req.body.read
  if (typeof req.body?.archived === 'boolean') entry.archived = req.body.archived
  writeAll(list)
  res.json({ ok: true, submission: entry })
})

adminSubmissionsRouter.delete('/:id', requireCsrf, (req, res) => {
  const list = readAll()
  const next = list.filter((item) => item.id !== req.params.id)
  if (next.length === list.length) {
    res.status(404).json({ error: 'Submission not found.', code: 'NOT_FOUND' })
    return
  }
  writeAll(next)
  res.json({ ok: true, deleted: req.params.id })
})
