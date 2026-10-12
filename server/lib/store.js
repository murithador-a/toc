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

/**
 * Create the directories the store needs.
 *
 * Never throws. Reading must keep working on a read-only deployment — a container
 * image, a serverless platform, a host that mounts the project as read-only — so
 * that the public site still serves from the committed content file. Only *writes*
 * fail there, and they fail with an explanation (see StorageError).
 */
const ensureDirs = () => {
  for (const dir of [path.dirname(config.contentFile), paths.backups, config.uploadsDir, config.dataDir]) {
    try {
      fs.mkdirSync(dir, { recursive: true })
    } catch {
      /* read-only or already exists — writes surface the problem properly */
    }
  }
}

const safeParse = (text) => {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Content file is not valid JSON: ${error.message}`)
  }
}

let cache = null

/**
 * Turn a filesystem failure into the one error an operator can act on. Used by
 * every code path that writes to disk, so a read-only deployment always answers
 * with the same explanation instead of a bare EACCES.
 */
export const storageFailure = (what, target, error) => {
  if (['EACCES', 'EROFS', 'EPERM', 'ENOSPC'].includes(error?.code)) {
    return new StorageError(
      `${what} could not be saved: ${target} is not writable on this deployment (${error.code}). ` +
        'Point DATA_DIR and UPLOADS_DIR at a persistent, writable path, then restart.',
      error,
    )
  }
  return error
}

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
  try {
    fs.copyFileSync(config.contentFile, target)
  } catch {
    // A missing rollback copy must never block a legitimate save.
    return
  }

  const files = fs
    .readdirSync(paths.backups)
    .filter((name) => name.startsWith('site-') && name.endsWith('.json'))
    .sort()
  for (const stale of files.slice(0, Math.max(0, files.length - MAX_BACKUPS))) {
    fs.rmSync(path.join(paths.backups, stale), { force: true })
  }
}

/**
 * Thrown when the deployment cannot write. Carries a code the routes turn into a
 * useful HTTP answer, and a message that names the path — because "EACCES" tells
 * an operator nothing about which directory to fix.
 */
export class StorageError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'StorageError'
    this.code = 'STORAGE_READONLY'
    this.status = 503
    this.cause = cause
  }
}

const guardStorage = (what, path) => (error) => {
  if (error?.code === 'EACCES' || error?.code === 'EROFS' || error?.code === 'EPERM' || error?.code === 'ENOSPC') {
    throw new StorageError(
      `${what} could not be saved: ${path} is not writable on this deployment (${error.code}). ` +
        'Point DATA_DIR and UPLOADS_DIR at a persistent, writable path.',
      error,
    )
  }
  throw error
}

export const writeContent = (content, { reason = 'save', client = 'admin' } = {}) => {
  const next = {
    ...content,
    meta: { ...(content.meta || {}), version: (content.meta?.version ?? 0) + 1, updatedAt: new Date().toISOString() },
  }
  const temp = `${config.contentFile}.${crypto.randomBytes(6).toString('hex')}.tmp`
  try {
    ensureDirs()
    backup(reason)
    fs.writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o644 })
    fs.renameSync(temp, config.contentFile) // atomic on the same filesystem
  } catch (error) {
    guardStorage('The change', config.contentFile)(error)
  }
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
