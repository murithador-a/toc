import type { MediaFile, SiteContent, Submission, SubmissionKind } from '../content/types'

export type { MediaFile, SiteContent, Submission, SubmissionKind }

/**
 * Admin API client.
 * ---------------------------------------------------------------------------
 * Everything the admin area needs, in one place. Three rules the rest of the
 * admin code relies on:
 *
 *  • Same-origin only. Requests go to relative paths, so the session cookie is
 *    attached by the browser and never exposed to JavaScript.
 *  • Every mutating request carries the CSRF token from the readable `toc_csrf`
 *    cookie in an `x-csrf-token` header, which the server compares against the
 *    cookie it set. A cross-site page cannot read the cookie, so it cannot forge
 *    the header.
 *  • Failures throw ApiError with the server's message and, when validation
 *    rejected the payload, the field-level details.
 */

export class ApiError extends Error {
  status: number
  code: string
  details: string[]

  constructor(status: number, message: string, code = 'ERROR', details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const CSRF_COOKIE = 'toc_csrf'

/**
 * Some browsers will not keep the session cookie — an embedded preview frame, a
 * third-party embed, or a visitor with cookies switched off. The server also
 * accepts the same signed session in an `x-admin-token` header, so the admin
 * keeps working there. The token is held for the life of the tab only.
 */
const TOKEN_KEY = 'toc_admin_token'
const TOKEN_HEADER = 'x-admin-token'

let memoryToken = ''

/**
 * Reading `document.cookie` throws outright in a document with an opaque origin
 * (a sandboxed frame), so it is guarded: no cookie simply means no double-submit
 * token, and the request falls back to the session token instead.
 */
const readCookie = (name: string): string => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : ''
  } catch {
    return ''
  }
}

/** Storage can throw outright inside a sandboxed frame, hence the fallback. */
export const setAdminToken = (token: string): void => {
  memoryToken = token
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token)
    else window.sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* keep it in memory for this page only */
  }
}

const readAdminToken = (): string => {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export const hasAdminToken = (): boolean => readAdminToken().length > 0

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Set false for public endpoints (no CSRF header needed) */
  csrf?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined

  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  if (options.csrf !== false && method !== 'GET') {
    const token = readCookie(CSRF_COOKIE)
    if (token) headers['x-csrf-token'] = token
  }

  const adminToken = readAdminToken()
  if (adminToken) headers[TOKEN_HEADER] = adminToken

  let response: Response
  try {
    response = await fetch(path, { method, headers, body, credentials: 'same-origin', signal: options.signal })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, 'The admin API could not be reached. Is the server running?', 'NETWORK')
  }

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const record = (payload ?? {}) as { error?: string; code?: string; details?: string[] }
    // An expired or rejected session: drop the fallback token so the next screen
    // shows the sign-in form rather than repeating a failing request.
    if (response.status === 401 && record.code === 'UNAUTHENTICATED') setAdminToken('')
    throw new ApiError(
      response.status,
      record.error || `Request failed with status ${response.status}`,
      record.code || 'ERROR',
      Array.isArray(record.details) ? record.details : [],
    )
  }

  return (payload ?? null) as T
}

/* ------------------------------------------------------------------ session */

export type ResetInfo = {
  /** True when the password can be changed from the browser (not env-managed) */
  available: boolean
  /** Whether a recovery address is on file — the address itself is never sent */
  hasEmail: boolean
  transport: 'smtp' | 'webhook' | 'none'
  minutes: number
}

export type SessionState = {
  configured: boolean
  signedIn: boolean
  expiresAt: string | null
  reset: ResetInfo
}

export const getSession = () => request<SessionState>('/api/auth/session', { csrf: false })

type CredentialResponse = { signedIn: boolean; csrfToken: string; token?: string }

export const login = async (password: string) => {
  const result = await request<CredentialResponse>('/api/auth/login', { method: 'POST', body: { password } })
  if (result.token) setAdminToken(result.token)
  return result
}

export const setupAdmin = async (password: string) => {
  const result = await request<CredentialResponse>('/api/auth/setup', { method: 'POST', body: { password } })
  if (result.token) setAdminToken(result.token)
  return result
}

/* ------------------------------------------------------------------ account */

export type AccountState = {
  email: string
  maskedEmail: string
  emailUpdatedAt: string | null
  passwordChangedAt: string | null
  /** Password comes from ADMIN_PASSWORD / ADMIN_PASSWORD_HASH — edit it there */
  passwordManagedByEnv: boolean
  mailConfigured: boolean
  mailTransport: 'smtp' | 'webhook' | 'none'
  reset: { pending: boolean; expiresAt: string | null; attemptsLeft: number; awaitingFile: boolean }
  resetMinutes: number
}

export const getAccount = () => request<AccountState>('/api/auth/account')

export const updateAccountEmail = (email: string, password: string) =>
  request<{ ok: true; email: string; maskedEmail: string; emailUpdatedAt: string }>('/api/auth/account/email', {
    method: 'POST',
    body: { email, password },
  })

export type ResetRequestResult = {
  ok: true
  delivery: 'email' | 'file'
  note: string
  expiresAt: string
  minutes: number
  fileHint: string
}

/** Unauthenticated on purpose — this is the "I cannot get in" path. */
export const requestPasswordReset = () =>
  request<ResetRequestResult>('/api/auth/reset/request', { method: 'POST', body: {}, csrf: false })

export const confirmPasswordReset = (code: string, newPassword: string) =>
  request<{ changed: true; signedIn: false }>('/api/auth/reset/confirm', {
    method: 'POST',
    body: { code, newPassword },
    csrf: false,
  })

export const logout = async () => {
  try {
    return await request<{ signedIn: boolean }>('/api/auth/logout', { method: 'POST' })
  } finally {
    setAdminToken('')
  }
}

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<{ changed: boolean }>('/api/auth/password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })

/* ------------------------------------------------------------------ content */

export type AdminContentResponse = {
  content: SiteContent
  updatedAt: string | null
  /** Filenames of recent automatic backups, newest first */
  backups: string[]
}

export const getAdminContent = (signal?: AbortSignal) =>
  request<AdminContentResponse>('/api/admin/content', { signal })

/** Replace one top-level section. The server merges it into the document. */
export const saveSection = <K extends keyof SiteContent>(section: K, value: SiteContent[K]) =>
  request<{ ok: true; content: SiteContent; updatedAt: string }>(`/api/admin/content/${String(section)}`, {
    method: 'PUT',
    body: { value },
  })

export const restoreBackup = (name?: string) =>
  request<{ ok: true; content: SiteContent }>('/api/admin/content/restore-backup', {
    method: 'POST',
    body: name ? { name } : {},
  })

/* ------------------------------------------------------------------ uploads */

export const listUploads = () => request<{ files: MediaFile[] }>('/api/admin/uploads')

export const uploadImage = (file: File, signal?: AbortSignal) => {
  const form = new FormData()
  form.append('file', file)
  return request<{ url: string; name: string; bytes: number; mime: string; width?: number; height?: number }>(
    '/api/admin/uploads',
    { method: 'POST', body: form, signal },
  )
}

export const deleteUpload = (name: string) =>
  request<{ ok: true }>(`/api/admin/uploads/${encodeURIComponent(name)}`, { method: 'DELETE' })

/* -------------------------------------------------------------- submissions */

export type InboxResponse = {
  submissions: Submission[]
  counts: { total: number; unread: number; inquiry: number; consultation: number; archived: number }
}

export const listSubmissions = (kind?: SubmissionKind | 'all') =>
  request<InboxResponse>(`/api/admin/submissions${kind && kind !== 'all' ? `?kind=${kind}` : ''}`)

export const patchSubmission = (id: string, patch: { read?: boolean; archived?: boolean; notes?: string }) =>
  request<{ ok: true; submission: Submission }>(`/api/admin/submissions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  })

export const deleteSubmission = (id: string) =>
  request<{ ok: true }>(`/api/admin/submissions/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const submissionsCsvUrl = () => '/api/admin/submissions/export.csv'

/* -------------------------------------------------------------------- system */

export type HealthResponse = {
  ok: boolean
  adminConfigured: boolean
  contentFile: string
  uptimeSeconds: number
}

export const getHealth = () => request<HealthResponse>('/api/health', { csrf: false })
