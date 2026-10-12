import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Keeps in-page navigation predictable:
 *  - new route without a hash → jump to the top
 *  - route with a hash (#inquiry, #services …) → scroll to that section
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      // Wait a frame so the target section exists after route changes
      const raf = window.requestAnimationFrame(() => {
        const target = document.getElementById(id)
        if (target) {
          target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
        }
      })
      return () => window.cancelAnimationFrame(raf)
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    return undefined
  }, [pathname, hash])

  return null
}
