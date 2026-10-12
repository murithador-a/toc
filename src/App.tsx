import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Contact from './pages/Contact'
import Consultation from './pages/Consultation'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

/**
 * The admin area is a separate application: it has its own layout, its own
 * content provider and no public chrome. Loading it lazily keeps every line of
 * admin code out of the bundle a visitor downloads.
 */
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-ivory">
                <p className="font-sans text-[0.875rem] text-stone-500">Loading the admin area…</p>
              </div>
            }
          >
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="consultation" element={<Consultation />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
