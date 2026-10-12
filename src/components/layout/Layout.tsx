import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { ScrollManager } from './ScrollManager'
import { WhatsAppFloat } from '../site/WhatsAppFloat'

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-ivory">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-charcoal focus:px-5 focus:py-3 focus:font-sans focus:text-[0.75rem] focus:uppercase focus:tracking-eyebrow focus:text-ivory"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  )
}
