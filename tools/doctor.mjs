#!/usr/bin/env node
/**
 * Deployment check — "why is the admin not working on my host?"
 * -----------------------------------------------------------------------------
 * Run this ON THE SERVER, from the project directory, with the same environment
 * the running process uses:
 *
 *     npm run doctor
 *
 * It looks at the eight things that actually break a deployment, says which ones
 * are wrong, and prints the fix. It never prints a secret: it reports whether
 * ADMIN_PASSWORD or the stored credential exists, never the value.
 *
 * Exit code is 0 when everything the admin needs is in place, 1 otherwise, so it
 * can be used as a release gate or a start-of-container health check.
 */
import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rel = (target) => path.relative(root, target) || '.'

/* --------------------------------------------------------------- reporting -- */

const results = []
/**
 * @param {'blocker'|'recommend'} severity  What a failure means. `blocker` = the
 *   admin cannot work until it is fixed; `recommend` = it will work, but not well.
 */
const record = (ok, title, detail, fix, severity = 'blocker') => {
  results.push({ ok, title, detail, fix, severity })
}
const green = (text) => `\u001b[32m${text}\u001b[0m`
const red = (text) => `\u001b[31m${text}\u001b[0m`
const dim = (text) => `\u001b[2m${text}\u001b[0m`
const bold = (text) => `\u001b[1m${text}\u001b[0m`

/* ------------------------------------------------------------ minimal .env -- */
/**
 * A deliberate 20-line reader: this tool has to work before `npm ci` has run, so
 * it cannot depend on dotenv. Values are read for paths only, never printed.
 */
const readEnvFile = (file) => {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key) out[key] = value
  }
  return out
}

const envFile = path.join(root, '.env')
const fileEnv = readEnvFile(envFile)
/** Same precedence as the server: the real environment wins over .env. */
const env = (key) => (process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : fileEnv[key])
const hasEnv = (key) => Boolean(env(key))

/* -------------------------------------------------------------- the checks -- */

// 1. Node version
const major = Number(process.versions.node.split('.')[0])
record(
  major >= 20,
  `Node.js ${process.versions.node}`,
  major >= 20 ? 'Supported.' : 'The project needs Node 20 or newer.',
  'Install Node 20+ on the host (or set the engine in your host’s dashboard) and redeploy.',
)

// 2. A built site
const distDir = path.resolve(root, env('DIST_DIR') || 'dist')
const built = fs.existsSync(path.join(distDir, 'index.html'))
record(
  built,
  `Built site ${green('dist/index.html')}`,
  built ? `Found at ${dim(rel(distDir))}.` : 'No build found. The server will answer "API is running" and nothing else.',
  'Run `npm ci && npm run build` as part of the deploy. dist/ is deliberately not committed — it must be built on the host or uploaded.',
)

// 3. The content file
const contentFile = path.resolve(root, env('CONTENT_FILE') || 'content/site.json')
let contentOk = false
let contentDetail = `Not found at ${rel(contentFile)}.`
if (fs.existsSync(contentFile)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(contentFile, 'utf8'))
    contentOk = Boolean(parsed && typeof parsed === 'object')
    const projects = Array.isArray(parsed?.projects?.items) ? parsed.projects.items.length : 0
    const published = Array.isArray(parsed?.projects?.items)
      ? parsed.projects.items.filter((item) => item?.status !== 'draft').length
      : 0
    contentDetail = `Parsed ok — ${projects} projects (${published} published).`
  } catch (error) {
    contentDetail = `Present but not valid JSON: ${error.message}`
  }
}
record(
  contentOk,
  'Content file',
  contentDetail,
  'Deploy content/site.json with the code, or set CONTENT_FILE to where it actually lives.',
)

// 4. Writable data directory — the usual culprit
const dataDir = path.resolve(root, env('DATA_DIR') || 'server/data')
const uploadsDir = path.resolve(root, env('UPLOADS_DIR') || path.join(dataDir, 'uploads'))
const probe = (dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true })
    } catch (error) {
      return error.code || error.message
    }
  }
  const probeFile = path.join(dir, `.toc-write-probe-${crypto.randomBytes(4).toString('hex')}`)
  try {
    fs.writeFileSync(probeFile, 'ok')
    fs.unlinkSync(probeFile)
    return null
  } catch (error) {
    return error.code || error.message
  }
}
const dataError = probe(dataDir)
const uploadsError = probe(uploadsDir)
const storageOk = !dataError && !uploadsError
record(
  storageOk,
  'Writable storage',
  storageOk
    ? `Wrote and deleted a probe file in ${dim(rel(dataDir))} and ${dim(rel(uploadsDir))}.`
    : `Cannot write: ${[dataError && `${rel(dataDir)} → ${dataError}`, uploadsError && `${rel(uploadsDir)} → ${uploadsError}`]
        .filter(Boolean)
        .join(', ')}`,
  [
    'This is what stops the admin working on a deployed site.',
    'Containers, serverless platforms and any host that runs the app from a read-only image cannot write inside the project folder.',
    'Mount a persistent disk/volume and point the app at it, e.g. DATA_DIR=/var/data UPLOADS_DIR=/var/data/uploads.',
  ].join(' '),
)

// 5. Admin credential
const authFile = path.join(dataDir, 'auth.json')
let credential = 'none'
if (hasEnv('ADMIN_PASSWORD')) credential = 'environment variable ADMIN_PASSWORD'
else if (hasEnv('ADMIN_PASSWORD_HASH')) credential = 'environment variable ADMIN_PASSWORD_HASH'
else if (fs.existsSync(authFile)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(authFile, 'utf8'))
    if (typeof parsed?.passwordHash === 'string' && parsed.passwordHash) {
      credential = `stored credential in ${rel(authFile)}`
      const mode = fs.statSync(authFile).mode & 0o777
      if (mode !== 0o600) {
        record(false, 'Credential file permissions', `${rel(authFile)} is mode ${mode.toString(8)} — should be 600.`, `chmod 600 ${rel(authFile)}`)
      }
    } else credential = 'auth.json exists but holds no password'
  } catch {
    credential = 'auth.json is unreadable'
  }
}
const noCredential = credential === 'none' || credential.includes('unreadable')
record(
  !noCredential || storageOk,
  'Admin credentials',
  noCredential
    ? storageOk
      ? 'No password configured yet — /admin will offer the one-time first-run setup. That is the normal state of a fresh deployment.'
      : 'No password configured, and this server cannot store one because it cannot write to disk.'
    : `Found: ${credential}. ${dim('(The value is never printed.)')}`,
  'Either set ADMIN_PASSWORD in the host’s environment variables, or leave it unset and open /admin to run the one-time first-run setup. On a fresh deploy with a fresh data directory you will always see first-run setup — that is not a fault.',
)

// 6. SESSION_SECRET
record(
  hasEnv('SESSION_SECRET'),
  'SESSION_SECRET',
  hasEnv('SESSION_SECRET')
    ? 'Set.'
    : 'Not set. Sessions are derived from the stored credential, so signing everyone out is the only way to invalidate them.',
  'Set SESSION_SECRET to a long random string (e.g. `openssl rand -hex 32`) and restart. Recommended on a real deployment.',
  'recommend',
)

// 7. Reverse proxy / TLS
const trustProxy = String(env('TRUST_PROXY') || '').toLowerCase()
record(
  Boolean(trustProxy),
  'TRUST_PROXY',
  trustProxy ? `Set to ${trustProxy}.` : 'Not set. Behind Nginx, Caddy or any PaaS router, every visitor appears to come from the proxy IP.',
  'Set TRUST_PROXY=true when a reverse proxy or load balancer terminates TLS, so the login lockout and rate limits count real client IPs.',
  'recommend',
)

// 8. Port
const configuredPort = Number(env('API_PORT') || env('PORT') || 8787)
const portFree = await new Promise((resolve) => {
  const server = net.createServer()
  server.once('error', (error) => resolve(error.code === 'EADDRINUSE' ? 'in-use' : String(error.code)))
  server.once('listening', () => server.close(() => resolve(true)))
  server.listen(configuredPort, env('HOST') || '0.0.0.0')
})
record(
  portFree === true || portFree === 'in-use',
  `Port ${configuredPort}`,
  portFree === 'in-use'
    ? 'Already in use — this is expected if the site is running right now.'
    : portFree === true
      ? 'Free.'
      : `Cannot bind (${portFree}).`,
  'Most hosts assign the port themselves through the PORT environment variable; API_PORT and PORT are both honoured, so do not hardcode 8787.',
  'recommend',
)

/* ------------------------------------------------------------------ output -- */

console.log('')
console.log(bold('  TOC admin — deployment check'))
console.log(dim(`  ${root}`))
console.log('')

for (const { ok, title, detail, fix } of results) {
  console.log(`  ${ok ? green('PASS') : red('FAIL')}  ${bold(title)}`)
  console.log(`        ${detail}`)
  if (!ok && fix) console.log(`        ${dim('→')} ${fix}`)
  console.log('')
}

const failures = results.filter((item) => !item.ok && item.severity === 'blocker')
const advice = results.filter((item) => !item.ok && item.severity === 'recommend')
if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      {
        ok: failures.length === 0,
        blockers: failures.map((f) => ({ title: f.title, detail: f.detail })),
        recommendations: advice.map((f) => ({ title: f.title, detail: f.detail })),
      },
      null,
      2,
    ),
  )
}

if (failures.length === 0) {
  if (advice.length > 0) {
    console.log(
      `  ${green('Everything the admin needs is in place.')} ${advice.length} recommendation${advice.length === 1 ? '' : 's'} above ${dim('(not blocking)')}.`,
    )
  } else {
    console.log(`  ${green('All checks passed.')}`)
  }
  console.log(`  Run the site with ${bold('npm start')} — it serves the site and ${bold('/admin')} on one port.`)
  console.log('')
  process.exit(0)
}

console.log(`  ${red(`${failures.length} blocker${failures.length === 1 ? '' : 's'}`)} — the admin cannot store changes until these are fixed.`)
if (advice.length > 0) {
  console.log(`  ${dim(`${advice.length} recommendation${advice.length === 1 ? '' : 's'} (not blocking).`)}`)
}
console.log('  The public site may still be serving correctly.')
console.log('')
process.exit(1)
