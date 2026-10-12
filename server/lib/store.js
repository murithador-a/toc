import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { config, paths } from './config.js'

/**
 * Content storage.
 * ---------------------------------------------------------------------------
 * The site content lives in a single JSON document (content/site.json by
 * default). Writes are atomic (temp file + rename) and every save is preceded by
 * a timestamped backup, so a bad edit can always be rolled back by restoring a
 * file from server/data/backups.
 *
 * Swapping this for a database later means reimplementing readContent /
 * writeContent only — the routes never touch the filesystem directly.
 */

const MAX_BACKUPS = 30

const ensureDirs = () => {
  fs.mkdirSync(path.dirname(config.contentFile), { recursive: true })
  fs.mkdirSync(paths.backups, { recursive: true })
  fs.mkdirSync(config.uploadsDir, { recursive: true })
}

const safeParse = (text) => {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Content file is not valid JSON: ${error.message}`)
  }
}

let cache = null

export const readContent = () => {
  ensureDirs()
  if (!fs.existsSync(config.contentFile)) throw new Error(`Content file not found: ${config.contentFile}`)
  const stat = fs.statSync(config.contentFile)
  if (cache && cache.mtimeMs === stat.mtimeMs) return cache.value
  const value = safeParse(fs.readFileSync(config.contentFile, 'utf8'))
  cache = { mtimeMs: stat.mtimeMs, value }
  return value
}

const backup = (reason) => {
  if (!fs.existsSync(config.contentFile)) return
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const target = path.join(paths.backups, `site-${stamp}-${reason}.json`)
  fs.copyFileSync(config.contentFile, target)

  const files = fs
    .readdirSync(paths.backups)
    .filter((name) => name.startsWith('site-') && name.endsWith('.json'))
    .sort()
  for (const stale of files.slice(0, Math.max(0, files.length - MAX_BACKUPS))) {
    fs.rmSync(path.join(paths.backups, stale), { force: true })
  }
}

export const writeContent = (content, { reason = 'save', client = 'admin' } = {}) => {
  ensureDirs()
  backup(reason)
  const next = {
    ...content,
    meta: { ...(content.meta || {}), version: (content.meta?.version ?? 0) + 1, updatedAt: new Date().toISOString() },
  }
  const temp = `${config.contentFile}.${crypto.randomBytes(6).toString('hex')}.tmp`
  fs.writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o644 })
  fs.renameSync(temp, config.contentFile) // atomic on the same filesystem
  cache = null
  console.log(`[content] saved by ${client} (${reason}) -> v${next.meta.version}`)
  return next
}

/** Restores the most recent backup — used by the admin "undo last save" action. */
/**
 * Put an earlier copy back.
 *
 * With no argument the newest backup wins. Pass `name` (exactly as listed by
 * listBackups) to roll back to a particular copy. The name is reduced to a bare
 * filename and must be one the backup directory actually holds, so it can never
 * be used to read or write outside it.
 */
export const restoreLatestBackup = (name) => {
  ensureDirs()
  const files = fs
    .readdirSync(paths.backups)
    .filter((entry) => entry.startsWith('site-') && entry.endsWith('.json'))
    .sort()
  if (!files.length) throw new Error('No backups available')
  let chosen = files[files.length - 1]
  if (typeof name === 'string' && name.trim()) {
    const wanted = path.basename(name.trim())
    if (!files.includes(wanted)) {
      const error = new Error(`No backup named "${wanted}"`)
      error.code = 'UNKNOWN_BACKUP'
      throw error
    }
    chosen = wanted
  }
  const restored = safeParse(fs.readFileSync(path.join(paths.backups, chosen), 'utf8'))
  writeContent(restored, { reason: 'restore', client: 'admin' })
  return restored
}

export const listBackups = () =>
  fs.existsSync(paths.backups)
    ? fs
        .readdirSync(paths.backups)
        .filter((name) => name.endsWith('.json'))
        .sort()
        .reverse()
        .map((name) => ({
          name,
          createdAt: fs.statSync(path.join(paths.backups, name)).mtime.toISOString(),
          bytes: fs.statSync(path.join(paths.backups, name)).size,
        }))
    : []

/** Drops fields that must never reach the public site. */
export const publicView = (content) => ({
  ...content,
  projects: {
    ...content.projects,
    items: (content.projects?.items ?? []).filter((item) => item.status === 'published'),
  },
  services: {
    ...content.services,
    items: (content.services?.items ?? []).filter((item) => item.published !== false),
  },
})
