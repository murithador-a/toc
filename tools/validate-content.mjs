/**
 * Validates content/site.json against the server's rules.
 * Run before deploying, or after editing the file by hand:
 *   npm run content:validate
 */
import { readFileSync } from 'node:fs'
import { validateContent } from '../server/lib/validate.js'

const file = process.argv[2] || 'content/site.json'
const content = JSON.parse(readFileSync(file, 'utf8'))
const result = validateContent(content)

if (result.ok) {
  const counts = {
    services: content.services.items.length,
    projects: content.projects.items.length,
    published: content.projects.items.filter((p) => p.status === 'published').length,
    drafts: content.projects.items.filter((p) => p.status === 'draft').length,
    stages: content.process.stages.length,
    faqs: content.faqs.items.length,
    reviews: content.reviews.excerpts.length,
  }
  console.log(`OK  ${file}`)
  console.log('   ', JSON.stringify(counts))
} else {
  console.error(`INVALID  ${file}`)
  result.errors.forEach((error) => console.error('   -', error))
  process.exit(1)
}
