/**
 * Runs the API and the Vite dev server together, so `npm run dev` gives you the
 * editable site and the admin area at the same time.
 *
 * The Vite dev server proxies /api and /uploads to the API, which is why the
 * browser only ever needs one origin — including inside a hosted preview.
 */
import { spawn } from 'node:child_process'
import process from 'node:process'

const apiPort = process.env.API_PORT || 8787

const children = []

const run = (name, command, args, env = {}) => {
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  })
  const prefix = `[${name}] `
  const relay = (stream) => stream.on('data', (chunk) => {
    String(chunk).split('\n').filter((line) => line.trim()).forEach((line) => console.log(prefix + line))
  })
  relay(child.stdout)
  relay(child.stderr)
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) console.error(`${prefix}exited with code ${code}`)
    children.forEach((other) => other !== child && other.kill('SIGTERM'))
    process.exitCode = code ?? 0
  })
  children.push(child)
  return child
}

console.log(`Starting API on 127.0.0.1:${apiPort} and the site dev server…`)
run('api', process.execPath, ['--watch', 'server/index.js'], { API_PORT: apiPort, HOST: '127.0.0.1' })
run('site', process.execPath, ['node_modules/vite/bin/vite.js'], { API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` })

const shutdown = () => {
  children.forEach((child) => child.kill('SIGTERM'))
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
