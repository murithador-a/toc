/** Small shared helpers — keep display strings and user input tidy. */

/** Collapse whitespace and cap length. Applied to every free-text field. */
export const normaliseText = (value: string, max = 400): string =>
  value.replace(/\s+/g, ' ').trim().slice(0, max)

/** Collapse whitespace but keep line breaks (project descriptions, notes). */
export const normaliseMultiline = (value: string, max = 2000): string =>
  value
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)

/** 0805 783 8376 -> 08057838376 (used for validation only) */
export const digitsOnly = (value: string): string => value.replace(/[^\d+]/g, '')

/** 2026-10-12 -> Monday, 12 October 2026 */
export const formatLongDate = (iso: string): string => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`

/** Today's date as YYYY-MM-DD in the visitor's own timezone. */
export const todayIso = (): string => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
