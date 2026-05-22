/**
 * Resets the window scroll position to the top on every route change.
 *
 * Mounted once at the app root in App.jsx. Renders nothing. Standard
 * React Router workaround — the router doesn't restore scroll by default,
 * so without this, navigating between pages would leave the new page
 * scrolled wherever the previous one was.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
