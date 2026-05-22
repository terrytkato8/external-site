/**
 * Fires a Google Analytics `page_view` event on every client-side route change.
 *
 * Mounted once at the app root in App.jsx so it sees all React Router
 * navigations. Renders nothing. No-ops if `window.gtag` isn't loaded
 * (e.g., when analytics is blocked or in local dev without the script).
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function Analytics() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', {
      page_path: pathname + search,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname, search])

  return null
}
