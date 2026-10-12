import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAdmin, type SaveState } from './AdminProvider'
import { sectionSchemas } from './schema'
import { Button, useRelativeTime } from './ui'
import { CommandPalette } from './CommandPalette'
import { AddMenu } from './AddMenu'
import { useContent } from '../content/context'

/** Persistent chrome for every admin screen. */

const saveLabels: Record<SaveState, string> = {
  idle: '',
  pending: 'Unsaved change…',
  saving: 'Saving…',
  saved: 'All changes saved',
  error: 'Could not save',
}

const saveTones: Record<SaveState, string> = {
  idle: 'text-stone-500',
  pending: 'text-bronze',
  saving: 'text-bronze',
  saved: 'text-stone-500',
  error: 'text-[#8d3b2f]',
}

export function SaveIndicator() {
  const { overall, savedAt } = useAdmin()
  const relative = useRelativeTime(savedAt)
  const label = overall === 'idle' || overall === 'saved' ? `Saved ${relative}` : saveLabels[overall]

  return (
    <span className={`inline-flex items-center gap-2 font-sans text-[0.75rem] ${saveTones[overall]}`} aria-live="polite">
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          overall === 'saving' || overall === 'pending'
            ? 'bg-bronze'
            : overall === 'error'
              ? 'bg-[#8d3b2f]'
              : 'bg-charcoal/40'
        }`}
      />
      {label || 'No changes yet'}
    </span>
  )
}

export function AdminLayout() {
  const { session, signOut, error, dismissError, content, undo, redo } = useAdmin()
  const publicContent = useContent()
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()
  const company = content?.company ?? publicContent.company
  const projects = content?.projects as { items?: unknown[] } | undefined
  const draftCount = projects?.items
    ? (projects.items as { status?: string }[]).filter((item) => item.status === 'draft').length
    : 0

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  /**
   * Keyboard shortcuts, available on every admin screen:
   *   Ctrl/⌘+K  quick find        Ctrl/⌘+Z  undo
   *   Ctrl/⌘+Shift+Z or Ctrl+Y    redo
   * Undo and redo are skipped while a text field has focus, so the browser's own
   * undo inside an input keeps working.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      const typing =
        target !== null && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      const key = event.key.toLowerCase()

      if (key === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (typing) return
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
      if (key === 'y') {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  const navLink = (to: string, label: string, extra?: string) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        `flex items-center justify-between gap-3 border-l-2 py-2.5 pl-3 pr-2 font-sans text-[0.875rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze ${
          isActive
            ? 'border-bronze bg-white text-charcoal'
            : 'border-transparent text-stone-600 hover:border-charcoal/20 hover:text-charcoal'
        }`
      }
    >
      <span>{label}</span>
      {extra ? <span className="font-sans text-[0.6875rem] text-stone-400">{extra}</span> : null}
    </NavLink>
  )

  const groups: { title: string; links: { to: string; label: string; extra?: string }[] }[] = [
    {
      title: 'Overview',
      links: [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/visual', label: 'Visual editor' },
        { to: '/admin/projects', label: 'Projects', extra: draftCount > 0 ? `${draftCount} draft` : undefined },
        { to: '/admin/media', label: 'Images' },
        { to: '/admin/inbox', label: 'Enquiries' },
      ],
    },
    {
      title: 'Page content',
      links: sectionSchemas.map((schema) => ({ to: `/admin/content/${schema.key}`, label: schema.title })),
    },
    {
      title: 'System',
      links: [{ to: '/admin/settings', label: 'Settings & backups' }],
    },
  ]

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-charcoal focus:bg-white focus:px-4 focus:py-2 focus:font-sans focus:text-[0.8125rem]"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-charcoal/10 bg-ivory/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="admin-nav"
              className="border border-charcoal/20 px-3 py-2 font-sans text-[0.6875rem] uppercase tracking-eyebrow text-charcoal lg:hidden"
            >
              Menu
            </button>
            <Link to="/admin" className="flex items-baseline gap-2.5">
              <span className="font-display text-[1.15rem] leading-none text-charcoal">{company.shortName}</span>
              <span className="font-sans text-[0.625rem] uppercase tracking-eyebrow text-bronze">Admin</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 border border-charcoal/20 px-3 py-2 font-sans text-[0.6875rem] text-stone-500 transition-colors hover:border-charcoal hover:text-charcoal sm:flex"
              title="Quick find (Ctrl+K)"
            >
              <span>Search everything</span>
              <span aria-hidden="true" className="border border-charcoal/20 px-1.5 py-0.5 text-[0.5625rem]">
                Ctrl K
              </span>
            </button>
            <AddMenu />
            <SaveIndicator />
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="border border-charcoal/20 px-3 py-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-charcoal"
            >
              View site
            </a>
            <Button
              tone="quiet"
              onClick={() => {
                void signOut()
              }}
            >
              Sign out
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#c9a49c] bg-[#FBF3F1] px-4 py-2.5 sm:px-6">
            <p className="font-sans text-[0.8125rem] text-[#8d3b2f]">{error}</p>
            <button
              type="button"
              onClick={dismissError}
              className="font-sans text-[0.6875rem] uppercase tracking-eyebrow text-[#8d3b2f] underline underline-offset-4"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </header>

      <div className="flex">
        <nav
          id="admin-nav"
          aria-label="Admin sections"
          className={`${
            menuOpen ? 'block' : 'hidden'
          } w-full shrink-0 border-r border-charcoal/10 bg-ivory px-3 py-5 lg:block lg:w-[16.5rem]`}
        >
          {groups.map((group) => (
            <div key={group.title} className="mb-7">
              <p className="px-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-stone-400">
                {group.title}
              </p>
              <div className="mt-3 space-y-0.5">
                {group.links.map((link) => navLink(link.to, link.label, link.extra))}
              </div>
            </div>
          ))}
          <p className="px-3 font-sans text-[0.6875rem] leading-relaxed text-stone-400">
            Signed in as administrator.
            {session?.expiresAt ? ` Session ends ${new Date(session.expiresAt).toLocaleString()}.` : ''}
          </p>
        </nav>

        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
