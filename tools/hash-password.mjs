/**
 * Prints an ADMIN_PASSWORD_HASH for the admin credential.
 *
 *   npm run admin:hash -- "your chosen password"
 *
 * Put the printed value in .env as ADMIN_PASSWORD_HASH. Prefer this over
 * ADMIN_PASSWORD if you would rather the plaintext never sits on the server.
 */
import { hashPassword } from '../server/lib/auth.js'

const password = process.argv.slice(2).join(' ').trim()

if (!password) {
  console.error('Usage: npm run admin:hash -- "your chosen password"')
  process.exit(1)
}
if (password.length < 10) {
  console.error('Choose a password of at least 10 characters.')
  process.exit(1)
}

console.log('\nAdd this line to .env (replace any existing ADMIN_PASSWORD / ADMIN_PASSWORD_HASH):\n')
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}\n`)
