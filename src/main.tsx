import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { ContentProvider } from './content/ContentProvider'
import './index.css'

// Arm the scroll-reveal styles only when the browser can actually run the
// observer, so content stays visible if JavaScript never executes.
if (typeof IntersectionObserver !== 'undefined') {
  document.documentElement.classList.add('js-reveal-armed')
}

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root was not found in index.html')
}

createRoot(container).render(
  <StrictMode>
    <HelmetProvider>
      {/* ContentProvider fetches the editable document from /api/content and
          falls back to the bundled copy when the site is deployed statically. */}
      <ContentProvider>
        {/* Opt in to the v7 behaviours now, so the upgrade is uneventful and
            the console stays free of deprecation warnings. */}
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </ContentProvider>
    </HelmetProvider>
  </StrictMode>,
)
