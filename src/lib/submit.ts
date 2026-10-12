import { consultationDestination, inquiryDestination, uploadDestination } from './integrations'
import { validateAttachment } from './forms'

/**
 * Submission handling.
 * ---------------------------------------------------------------------------
 * • Posts JSON to the configured destination with a timeout.
 * • A success state is only ever returned when the destination actually accepted
 *   the payload and replied with a 2xx status.
 * • When nothing is configured, the caller shows the WhatsApp hand-off instead —
 *   clearly labelled as "not sent automatically".
 */

export type SubmitOutcome =
  | { status: 'sent'; reference?: string }
  | { status: 'fallback'; reason: 'not-configured' }
  | { status: 'error'; message: string; fieldErrors?: string[] }

const TIMEOUT_MS = 20_000

const postJson = async (endpoint: string, payload: unknown): Promise<Response> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timer)
  }
}

const friendlyError = (error: unknown): string => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'The request took too long to complete. Please check your connection and try again, or continue on WhatsApp.'
  }
  return 'We could not send your request just now. Please try again, or continue the conversation on WhatsApp.'
}

const submit = async (endpoint: string, payload: unknown): Promise<SubmitOutcome> => {
  if (!endpoint) return { status: 'fallback', reason: 'not-configured' }
  try {
    const response = await postJson(endpoint, payload)
    if (response.ok) {
      const body = (await response.json().catch(() => ({}))) as { id?: string }
      return { status: 'sent', reference: body?.id }
    }
    if (response.status === 422) {
      const body = (await response.json().catch(() => ({}))) as { details?: string[] }
      return {
        status: 'error',
        message: 'Some details were not accepted. Please check the form and try again, or continue on WhatsApp.',
        fieldErrors: body?.details,
      }
    }
    if (response.status === 429) {
      return {
        status: 'error',
        message: 'Too many submissions from this connection. Please wait a few minutes, or continue on WhatsApp.',
      }
    }
    return {
      status: 'error',
      message:
        response.status >= 500
          ? 'Our form service is temporarily unavailable. Please try again shortly, or continue on WhatsApp.'
          : 'Some details could not be accepted. Please check the form and try again, or continue on WhatsApp.',
    }
  } catch (error) {
    return { status: 'error', message: friendlyError(error) }
  }
}

export const submitInquiry = (payload: unknown): Promise<SubmitOutcome> =>
  submit(inquiryDestination(), payload)

export const submitConsultation = (payload: unknown): Promise<SubmitOutcome> =>
  submit(consultationDestination(), payload)

/**
 * Uploads attachments when a secure endpoint is configured. The built-in admin
 * upload route is authenticated, so this path only ever uses an explicit
 * VITE_INQUIRY_UPLOAD_ENDPOINT supplied by the deployment.
 */
export const uploadAttachments = async (files: File[]): Promise<{ ok: boolean; skipped: boolean; message?: string }> => {
  if (!files.length) return { ok: true, skipped: true }
  const endpoint = uploadDestination()
  if (!endpoint) return { ok: false, skipped: true }

  for (const file of files) {
    const error = validateAttachment(file)
    if (error) return { ok: false, skipped: false, message: error }
  }

  const body = new FormData()
  files.forEach((file) => body.append('files', file))

  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 45_000)
    const response = await fetch(endpoint, { method: 'POST', body, signal: controller.signal })
    window.clearTimeout(timer)
    if (!response.ok) return { ok: false, skipped: false, message: 'The attachment could not be uploaded.' }
    return { ok: true, skipped: false }
  } catch {
    return { ok: false, skipped: false, message: 'The attachment could not be uploaded. You can send it on WhatsApp instead.' }
  }
}

/** Very light duplicate-submit guard (per browser session). */
export const recentlySubmitted = (key: string, windowMs = 30_000): boolean => {
  try {
    const stored = window.sessionStorage.getItem(`toc:${key}`)
    if (!stored) return false
    return Date.now() - Number(stored) < windowMs
  } catch {
    return false
  }
}

export const markSubmitted = (key: string): void => {
  try {
    window.sessionStorage.setItem(`toc:${key}`, String(Date.now()))
  } catch {
    /* storage unavailable — non-critical */
  }
}
