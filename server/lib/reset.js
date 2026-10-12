import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config.js'

/**
 * Forgotten-password reset codes.
 * ---------------------------------------------------------------------------
 * A reset is a different situation from a login, so it gets its own rules:
 *
 *  • The code is single-use, expires (30 minutes by default) and dies after five
 *    wrong guesses — a six-digit code would otherwise be guessable.
 *  • Only a hash of the code is stored, in server/data/reset.json (mode 600), so
 *    reading the file does not hand anyone the reset.
 *  • When mail is configured the code is emailed to the recovery address and the
 *    plaintext is never written anywhere. When mail is NOT configured the code is
 *    written to server/data/reset-code.txt (mode 600) and the log names that
 *    file — the only honest delivery available on a server that cannot send mail.
 *  • Consuming a code deletes both files.
 */

const storeFile = () => path.join(config.dataDir, 'reset.json')
const codeFile = () => path.join(config.dataDir, 'reset-code.txt')
const MAX_ATTEMPTS = 5

/** No 0/O/1/I/L — these get read aloud or typed from a file. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

const makeCode = () => {
  const bytes = crypto.randomBytes(10)
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

const hash = (code) => crypto.createHash('sha256').update(`toc-reset:${String(code).trim().toUpperCase()}`).digest('hex')

const readStore = () => {
  try {
    if (!fs.existsSync(storeFile())) return null
    const parsed = JSON.parse(fs.readFileSync(storeFile(), 'utf8'))
    if (!parsed?.hash || !parsed?.expiresAt) return null
    return parsed
  } catch {
    return null
  }
}

const writeStore = (payload) => {
  fs.mkdirSync(config.dataDir, { recursive: true })
  fs.writeFileSync(storeFile(), JSON.stringify(payload, null, 2), { mode: 0o600 })
}

export const discardReset = () => {
  for (const file of [storeFile(), codeFile()]) {
    try {
      fs.rmSync(file, { force: true })
    } catch {
      /* nothing to remove */
    }
  }
}

/**
 * Creates a code, replacing any earlier one. `deliveredByEmail` decides whether
 * the plaintext is also written to disk for the operator to read.
 */
export const createReset = ({ deliveredByEmail }) => {
  discardReset()
  const code = makeCode()
  const expiresAt = new Date(Date.now() + config.resetMinutes * 60_000).toISOString()
  writeStore({ hash: hash(code), createdAt: new Date().toISOString(), expiresAt, attempts: 0 })
  if (!deliveredByEmail) {
    fs.writeFileSync(codeFile(), `${code}\n`, { mode: 0o600 })
  }
  return { code, expiresAt }
}

/** Validates without consuming. Counts the attempt, on the way out. */
export const verifyResetCode = (code) => {
  const store = readStore()
  if (!store) return { ok: false, reason: 'none' }
  if (Date.parse(store.expiresAt) < Date.now()) {
    discardReset()
    return { ok: false, reason: 'expired' }
  }
  if (store.attempts >= MAX_ATTEMPTS) {
    discardReset()
    return { ok: false, reason: 'too-many' }
  }
  const given = hash(code)
  const same = given.length === store.hash.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(store.hash))
  if (!same) {
    const attempts = store.attempts + 1
    if (attempts >= MAX_ATTEMPTS) discardReset()
    else writeStore({ ...store, attempts })
    return { ok: false, reason: attempts >= MAX_ATTEMPTS ? 'too-many' : 'wrong', attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts) }
  }
  return { ok: true }
}

/** Reports what is pending, for the admin UI. Never reveals the code. */
export const resetStatus = () => {
  const store = readStore()
  if (!store) return { pending: false, expiresAt: null, attemptsLeft: MAX_ATTEMPTS, awaitingFile: fs.existsSync(codeFile()) }
  if (Date.parse(store.expiresAt) < Date.now()) {
    discardReset()
    return { pending: false, expiresAt: null, attemptsLeft: MAX_ATTEMPTS, awaitingFile: false }
  }
  return {
    pending: true,
    expiresAt: store.expiresAt,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - store.attempts),
    awaitingFile: fs.existsSync(codeFile()),
  }
}

export const RESET_FILE_HINT = 'server/data/reset-code.txt'
