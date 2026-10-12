import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, getAdminContent, getSession, logout, saveSection, type SessionState } from '../lib/api'
import type { SiteContent } from '../content/types'

/**
 * Admin state.
 * ---------------------------------------------------------------------------
 * Holds the *editing* copy of content/site.json — drafts included — and the
 * signed-in session. It is deliberately separate from the public ContentProvider
 * so that a half-finished edit cannot leak into the live site tree.
 *
 * Saving is debounced per section. Typing in a field schedules a PUT of that one
 * section 1.2s later; further edits inside the window reset the timer and only
 * the final value is sent. Sections are saved one at a time, so a slow save on a
 * large section never blocks a small one elsewhere.
 */

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/** A rollback copy of the content file kept by the server. */
export type BackupFile = { name: string; createdAt?: string; bytes?: number }

type ContentRecord = SiteContent & Record<string, unknown>

type AdminContextValue = {
  session: SessionState | null
  sessionLoading: boolean
  refreshSession: () => Promise<void>
  /**
   * Set when the session request could not reach an API at all — a static host
   * serving the site has no /api, and no password form can help there. `null`
   * once the API answers.
   */
  apiProblem: string | null
  signOut: () => Promise<void>

  content: ContentRecord | null
  contentLoading: boolean
  contentError: string | null
  reloadContent: () => Promise<void>

  /** Per-section save status, for the field-level indicators */
  status: Record<string, SaveState>
  /** Worst status across all sections — drives the header indicator */
  overall: SaveState
  error: string | null
  dismissError: () => void
  /** ISO timestamp of the last successful save */
  savedAt: string | null
  /** Automatic backups, newest first */
  backups: BackupFile[]

  /** Queue a change to one section. `mutate` receives the current value. */
  update: <K extends keyof ContentRecord>(section: K, mutate: (draft: ContentRecord[K]) => ContentRecord[K]) => void
  /** Queue a whole-section replacement (used by the raw JSON editor) */
  replace: <K extends keyof ContentRecord>(section: K, value: ContentRecord[K]) => void
  /** Send every pending section immediately (used before leaving a screen) */
  flush: () => Promise<void>
  restoreLocal: () => void

  /** Step back and forward through every edit made in this session */
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Where the last change landed, e.g. "Home page — hero · headline" */
  lastChange: { section: string; at: number } | null
}

const AdminContext = createContext<AdminContextValue | null>(null)

const SAVE_DEBOUNCE_MS = 1200

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const rank: Record<SaveState, number> = { error: 4, saving: 3, pending: 2, saved: 1, idle: 0 }

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [apiProblem, setApiProblem] = useState<string | null>(null)
  const [content, setContent] = useState<ContentRecord | null>(null)
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, SaveState>>({})
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [backups, setBackups] = useState<BackupFile[]>([])

  const pending = useRef(new Map<string, number>())
  const latest = useRef<ContentRecord | null>(null)
  const baseline = useRef<ContentRecord | null>(null)

  /**
   * Undo history. Snapshots are whole documents — they are small (a few tens of
   * KB) and copying one is cheaper than the bookkeeping needed to store deltas.
   * Consecutive edits to the same section within a second collapse into a single
   * step, so undo walks back over "phrases" rather than individual keystrokes.
   */
  const past = useRef<{ snapshot: ContentRecord; section: string; at: number }[]>([])
  const future = useRef<ContentRecord[]>([])
  const [historyVersion, setHistoryVersion] = useState(0)
  const [lastChange, setLastChange] = useState<{ section: string; at: number } | null>(null)

  const remember = useCallback((section: string) => {
    const current = latest.current
    if (!current) return
    const top = past.current[past.current.length - 1]
    const now = Date.now()
    if (top && top.section === section && now - top.at < 1500) {
      top.at = now
    } else {
      past.current.push({ snapshot: clone(current), section, at: now })
      if (past.current.length > 60) past.current.shift()
    }
    future.current = []
    setLastChange({ section, at: now })
    setHistoryVersion((version) => version + 1)
  }, [])

  const refreshSession = useCallback(async () => {
    setSessionLoading(true)
    try {
      setSession(await getSession())
      setApiProblem(null)
    } catch (cause) {
      /**
       * Two different failures used to look identical. A refused or failed
       * request against a running API means "the session is gone, show the
       * sign-in form". A response that is not JSON, or no response at all,
       * means the request never reached an API — a static host serving this
       * site has no /api. There, the sign-in form is a dead end, so we record
       * the reason and let the screen explain it rather than pretend.
       */
      const noApi = cause instanceof ApiError && (cause.code === 'NO_API' || cause.code === 'NETWORK')
      setApiProblem(noApi ? cause.message : null)
      setSession(
        noApi
          ? null
          : {
              configured: true,
              signedIn: false,
              expiresAt: null,
              reset: { available: true, hasEmail: false, transport: 'none', minutes: 30 },
            },
      )
    } finally {
      setSessionLoading(false)
    }
  }, [])

  const loadContent = useCallback(async () => {
    setContentLoading(true)
    try {
      const payload = await getAdminContent()
      const next = payload.content as ContentRecord
      latest.current = next
      baseline.current = clone(next)
      setContent(next)
      setSavedAt(payload.updatedAt)
      // The server sends objects ({name, createdAt, bytes}); older installs sent
      // bare filenames — accept both so an upgrade never breaks the screen.
      setBackups(
        (payload.backups ?? []).map((entry) =>
          typeof entry === 'string' ? { name: entry } : (entry as BackupFile),
        ),
      )
      setContentError(null)
    } catch (cause) {
      setContentError(cause instanceof ApiError ? cause.message : 'Content could not be loaded.')
    } finally {
      setContentLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession().then(() => undefined)
  }, [refreshSession])

  useEffect(() => {
    if (session?.signedIn) void loadContent()
  }, [session?.signedIn, loadContent])

  const signOut = useCallback(async () => {
    // Save anything outstanding before dropping the session, otherwise the last
    // few keystrokes would be lost.
    for (const [section, timer] of pending.current.entries()) {
      window.clearTimeout(timer)
      pending.current.delete(section)
      const value = latest.current?.[section]
      if (value !== undefined) {
        try {
          await saveSection(section as keyof SiteContent, value as never)
        } catch {
          /* signing out matters more than the last save */
        }
      }
    }
    await logout().catch(() => undefined)
    setSession({
      configured: true,
      signedIn: false,
      expiresAt: null,
      reset: { available: true, hasEmail: false, transport: 'none', minutes: 30 },
    })
    setContent(null)
  }, [])

  const send = useCallback(async (section: string) => {
    const value = latest.current?.[section]
    if (value === undefined) return
    setStatus((current) => ({ ...current, [section]: 'saving' }))
    try {
      const result = await saveSection(section as keyof SiteContent, value as never)
      // The server returns the saved document; keep local edits that arrived
      // while the request was in flight by only adopting the meta block.
      latest.current = latest.current ? { ...latest.current, meta: result.content.meta } : latest.current
      baseline.current = clone(result.content) as ContentRecord
      setSavedAt(result.updatedAt)
      setStatus((current) => ({ ...current, [section]: 'saved' }))
      setError(null)
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? [cause.message, ...cause.details.slice(0, 4)].join(' · ')
          : 'The change could not be saved.'
      setError(message)
      setStatus((current) => ({ ...current, [section]: 'error' }))
    }
  }, [])

  const schedule = useCallback(
    (section: string) => {
      const existing = pending.current.get(section)
      if (existing) window.clearTimeout(existing)
      setStatus((current) => ({ ...current, [section]: 'pending' }))
      const timer = window.setTimeout(() => {
        pending.current.delete(section)
        void send(section)
      }, SAVE_DEBOUNCE_MS)
      pending.current.set(section, timer)
    },
    [send],
  )

  const update = useCallback<AdminContextValue['update']>(
    (section, mutate) => {
      remember(String(section))
      setContent((current) => {
        if (!current) return current
        const key = String(section)
        const next = { ...current, [key]: mutate(current[key]) }
        latest.current = next
        return next
      })
      schedule(String(section))
    },
    [remember, schedule],
  )

  const replace = useCallback<AdminContextValue['replace']>(
    (section, value) => {
      remember(String(section))
      setContent((current) => {
        if (!current) return current
        const next = { ...current, [String(section)]: value }
        latest.current = next
        return next
      })
      schedule(String(section))
    },
    [remember, schedule],
  )

  const flush = useCallback(async () => {
    const sections = [...pending.current.keys()]
    sections.forEach((section) => {
      const timer = pending.current.get(section)
      if (timer) window.clearTimeout(timer)
      pending.current.delete(section)
    })
    for (const section of sections) await send(section)
  }, [send])

  const undo = useCallback(() => {
    const entry = past.current.pop()
    if (!entry) return
    if (latest.current) future.current.push(clone(latest.current))
    latest.current = entry.snapshot
    setContent(entry.snapshot)
    setHistoryVersion((version) => version + 1)
    setLastChange({ section: entry.section, at: Date.now() })
    schedule(entry.section)
  }, [schedule])

  const redo = useCallback(() => {
    const snapshot = future.current.pop()
    if (!snapshot) return
    if (latest.current) past.current.push({ snapshot: clone(latest.current), section: '', at: Date.now() })
    latest.current = snapshot
    setContent(snapshot)
    setHistoryVersion((version) => version + 1)
    schedule('')
    // A whole-document step may touch several sections; save them all.
    const sections = new Set(Object.keys(snapshot as Record<string, unknown>))
    sections.forEach((section) => schedule(section))
  }, [schedule])

  /** Throw away local edits and go back to the last saved document. */
  const restoreLocal = useCallback(() => {
    if (!baseline.current) return
    latest.current = baseline.current
    setContent(baseline.current)
    setStatus({})
    setError(null)
  }, [])

  const overall = useMemo<SaveState>(() => {
    const values = Object.values(status)
    if (values.length === 0) return 'idle'
    return values.reduce((worst, value) => (rank[value] > rank[worst] ? value : worst), 'idle' as SaveState)
  }, [status])

  const value = useMemo<AdminContextValue>(
    () => ({
      session,
      sessionLoading,
      refreshSession,
      apiProblem,
      signOut,
      content,
      contentLoading,
      contentError,
      reloadContent: loadContent,
      status,
      overall,
      error,
      dismissError: () => setError(null),
      savedAt,
      backups,
      update,
      replace,
      flush,
      restoreLocal,
      undo,
      redo,
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
      lastChange,
    }),
    [
      session,
      sessionLoading,
      refreshSession,
      apiProblem,
      signOut,
      content,
      contentLoading,
      contentError,
      loadContent,
      status,
      overall,
      error,
      savedAt,
      backups,
      update,
      replace,
      flush,
      restoreLocal,
      undo,
      redo,
      historyVersion,
      lastChange,
    ],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used inside <AdminProvider>')
  return context
}
