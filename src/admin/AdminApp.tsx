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
import { Card } from './ui'

/**
 * The admin application, mounted at /admin/*.
 *
 * It is loaded lazily from src/App.tsx so none of this code reaches a visitor who
 * only ever looks at the public site, and the provider fetches content from
 * /api/admin/content (drafts included) rather than the public document.
 */
function AdminRoutes() {
  const { session, sessionLoading, refreshSession } = useAdmin()

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="font-sans text-[0.875rem] text-stone-500">Checking your session…</p>
      </div>
    )
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
