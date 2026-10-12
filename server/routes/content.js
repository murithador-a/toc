import { Router } from 'express'
import { readContent, writeContent, restoreLatestBackup, listBackups, publicView } from '../lib/store.js'
import { validateContent, validateSectionName } from '../lib/validate.js'
import { requireAdmin, requireCsrf } from '../lib/auth.js'

export const publicContentRouter = Router()
export const adminContentRouter = Router()

adminContentRouter.use(requireAdmin)

/** Public document — drafts stripped. */
publicContentRouter.get('/', (_req, res, next) => {
  try {
    const content = readContent()
    res.set('Cache-Control', 'no-cache')
    res.json({ content: publicView(content), updatedAt: content.meta?.updatedAt ?? null })
  } catch (error) {
    next(error)
  }
})

/** Full document, including drafts — admin only. */
adminContentRouter.get('/', (_req, res, next) => {
  try {
    const content = readContent()
    res.set('Cache-Control', 'no-store')
    res.json({ content, updatedAt: content.meta?.updatedAt ?? null, backups: listBackups().slice(0, 10) })
  } catch (error) {
    next(error)
  }
})

/** Replace the whole document (Advanced editor). */
adminContentRouter.put('/', requireCsrf, (req, res, next) => {
  try {
    const next_ = req.body?.content
    const result = validateContent(next_)
    if (!result.ok) {
      res.status(422).json({ error: 'The document did not pass validation.', code: 'INVALID_CONTENT', details: result.errors.slice(0, 25) })
      return
    }
    const saved = writeContent(next_, { reason: 'document', client: 'admin' })
    res.json({ ok: true, content: saved, updatedAt: saved.meta.updatedAt })
  } catch (error) {
    next(error)
  }
})

/** Replace a single top-level section — what every admin screen uses. */
adminContentRouter.put('/:section', requireCsrf, (req, res, next) => {
  try {
    const { section } = req.params
    if (!validateSectionName(section)) {
      res.status(404).json({ error: `Unknown section "${section}"`, code: 'UNKNOWN_SECTION' })
      return
    }
    // Accept either { value } (the documented contract) or { [section]: … } so a
    // caller that names the section in the body still works.
    const body = req.body ?? {}
    const value = body.value !== undefined ? body.value : body[section]
    if (value === undefined) {
      res.status(400).json({ error: `Send the new section as { "value": … }.`, code: 'MISSING_VALUE' })
      return
    }
    const current = readContent()
    const merged = { ...current, [section]: value }
    const result = validateContent(merged)
    if (!result.ok) {
      res.status(422).json({ error: 'The section did not pass validation.', code: 'INVALID_CONTENT', details: result.errors.slice(0, 25) })
      return
    }
    const saved = writeContent(merged, { reason: section, client: 'admin' })
    res.json({ ok: true, content: saved, updatedAt: saved.meta.updatedAt })
  } catch (error) {
    next(error)
  }
})

/** Roll the content file back to the previous save. */
adminContentRouter.post('/restore-backup', requireCsrf, (req, res, next) => {
  try {
    // Optional { name } from the Settings screen; without it the newest copy wins.
    const restored = restoreLatestBackup(req.body?.name)
    res.json({ ok: true, content: restored, updatedAt: restored.meta?.updatedAt ?? null })
  } catch (error) {
    if (error?.code === 'UNKNOWN_BACKUP') {
      res.status(404).json({ error: error.message, code: 'UNKNOWN_BACKUP' })
      return
    }
    next(error)
  }
})
