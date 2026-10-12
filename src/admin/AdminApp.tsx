import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { AdminLogin } from './AdminLogin'
import { AdminProvider, useAdmin } from './AdminProvider'
import { Dashboard } from './pages/Dashboard'
import { SectionEditor } from './pages/SectionEditor'
import { ProjectsAdmin } from './pages/ProjectsAdmin'
import { ProjectEditor } from './pages/ProjectEditor'
import { NewProject } from './pages/NewProject'
import { MediaLibrary } from './pages/MediaLibrary'
import { Inbox } from './pages/Inbox'
import { Settings } from './pages/Settings'
import { VisualEditor } from './visual/VisualEditor'
import { Button, Card } from './ui'

/**
 * Shown when there is no admin API to talk to at all — normally a static host
 * (Vercel, Netlify, GitHub Pages, S3) that serves the site and rewrites every
 * path, /api/* included, to index.html. The sign-in form is deliberately not
 * offered: there is nothing behind it to accept a password or store one.
 */
function NoApi({ detail, onRetry }: { detail: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-5 py-16">
      <div className="w-full max-w-2xl border border-charcoal/12 bg-white p-8 sm:p-10">
        <p className="flex items-center gap-3 font-sans text-[0.625rem] font-semibold uppercase tracking-eyebrow text-bronze">
          <span aria-hidden="true" className="h-px w-6 bg-bronze" />
          TOC Luxury Constructions
        </p>
        <h1 className="mt-6 font-display text-[2rem] leading-tight text-charcoal">The admin is not available here</h1>
        <p className="mt-4 font-sans text-[0.9375rem] leading-relaxed text-stone-600">
          The website is being served, but the part that runs the admin — a small server that stores your content,
          images and password — is not. This is what happens when the site is published on a static host such as
          Vercel, Netlify, Cloudflare Pages or GitHub Pages: those serve files very well and cannot run a server.
        </p>
        <p className="mt-4 font-sans text-[0.8125rem] leading-relaxed text-stone-500">
          Signing in is not possible until the site is deployed somewhere that runs Node — then this same address
          opens the normal sign-in screen. The step-by-step fix is in{' '}
          <span className="font-mono text-[0.75rem]">docs/DEPLOY.md</span> in the project.
        </p>
        {detail ? (
          <pre className="mt-5 overflow-x-auto whitespace-pre-wrap break-words border border-charcoal/12 bg-ivory px-4 py-3 font-mono text-[0.6875rem] leading-relaxed text-stone-500">
            {detail}
          </pre>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={onRetry}>Check again</Button>
          <a
            href="/"
            className="inline-flex items-center border border-charcoal/20 px-5 py-3 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-charcoal transition-colors hover:border-bronze hover:text-bronze"
          >
            Back to the website
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * The admin application, mounted at /admin/*.
 *
 * It is loaded lazily from src/App.tsx so none of this code reaches a visitor who
 * only ever looks at the public site, and the provider fetches content from
 * /api/admin/content (drafts included) rather than the public document.
 */
function AdminRoutes() {
  const { session, sessionLoading, refreshSession, apiProblem } = useAdmin()

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="font-sans text-[0.875rem] text-stone-500">Checking your session…</p>
      </div>
    )
  }

  if (apiProblem && !session?.signedIn) {
    return <NoApi detail={apiProblem} onRetry={() => void refreshSession()} />
  }

  if (!session?.signedIn) {
    return (
      <AdminLogin
        configured={Boolean(session?.configured)}
        reset={session?.reset}
        onSignedIn={() => void refreshSession()}
      />
    )
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="visual" element={<VisualEditor />} />
        <Route path="visual/:page" element={<VisualEditor />} />
        <Route path="projects" element={<ProjectsAdmin />} />
        <Route path="projects/new" element={<NewProject />} />
        <Route path="projects/:slug" element={<ProjectEditor />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="content/:section" element={<SectionEditor />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="*"
          element={
            <Card title="Not found">
              <p className="font-sans text-[0.875rem] text-stone-600">
                That admin screen does not exist. Use the menu to pick a section.
              </p>
            </Card>
          }
        />
      </Route>
    </Routes>
  )
}

export default function AdminApp() {
  return (
    <AdminProvider>
      <AdminRoutes />
    </AdminProvider>
  )
}
