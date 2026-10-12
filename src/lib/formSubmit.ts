import type { KeyboardEvent } from 'react'

/**
 * Enter-to-submit for forms that must survive a sandboxed preview frame.
 *
 * A frame with `sandbox="allow-scripts"` and no `allow-forms` blocks submission
 * *before* the browser fires the `submit` event, so a click on a submit button
 * or Enter in a field silently does nothing — no request, no error. Every form
 * on this site therefore calls its handler directly (buttons carry
 * `type="button"`) and relies on this helper for the keyboard, which keeps the
 * normal browser behaviour identical while working in a restricted frame.
 */
const NON_SUBMITTING_INPUTS = new Set(['checkbox', 'radio', 'file', 'range', 'color', 'submit', 'button', 'reset'])

export const submitOnEnter =
  (submit: () => void) =>
  (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key !== 'Enter' || event.defaultPrevented) return
    const target = event.target as HTMLElement | null
    if (!target || target.tagName !== 'INPUT') return
    const type = (target.getAttribute('type') ?? 'text').toLowerCase()
    if (NON_SUBMITTING_INPUTS.has(type)) return
    event.preventDefault()
    submit()
  }
