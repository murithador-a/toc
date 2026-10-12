import type { SiteContent } from './types'

/**
 * Resolves {{tokens}} inside any text field so company details can change in one
 * place. Editors may use these anywhere: e.g. "Call {{phone}} to arrange a visit."
 *
 * Applied once over the whole document before it reaches the UI.
 */
export const tokensFor = (content: SiteContent): Record<string, string> => ({
  company: content.company.legalName,
  shortCompany: content.company.shortName,
  phone: content.company.phone.display,
  whatsapp: content.company.whatsapp.display,
  address: content.company.addressFull,
  addressShort: content.company.addressShort,
  email: content.company.email,
  siteUrl: content.seo.siteUrl,
})

const TOKEN_RE = /\{\{\s*([a-zA-Z]+)\s*\}\}/g

const resolve = (value: string, tokens: Record<string, string>): string =>
  value.replace(TOKEN_RE, (match, key: string) => {
    const replacement = tokens[key]
    return replacement === undefined ? match : replacement
  })

/** Deep-walks the content document, resolving tokens in every string. */
export const interpolateContent = (content: SiteContent, tokens = tokensFor(content)): SiteContent => {
  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') return resolve(value, tokens)
    if (Array.isArray(value)) return value.map(walk)
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [key, entry] of Object.entries(value as Record<string, unknown>)) out[key] = walk(entry)
      return out
    }
    return value
  }
  return walk(content) as SiteContent
}
