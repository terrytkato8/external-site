import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { games } from '../data/games'
import { socialLinks, SocialIcon } from './SocialIcons'

/**
 * Slide-in hamburger menu for narrow viewports.
 *
 * Rendered by `Nav`. Owns the backdrop + side panel; `Nav` owns the
 * hamburger button and the open/close state.
 *
 * Sections (mirror the desktop nav): Games (from `games.js`), Studio
 * (About link), Community (social icons from `SocialIcons`).
 *
 * Behavior:
 *   - Closes automatically when the route changes (so tapping a link
 *     dismisses it).
 *   - Closes on the Escape key while open.
 *   - Toggles a `mobile-menu-open` class on `document.body` while open
 *     (used by CSS to lock scroll, etc.).
 *
 * Props:
 *   open    — boolean. Whether the panel is visible.
 *   onClose — () => void. Called when the user dismisses (backdrop click,
 *             Escape, or route change).
 */
export default function MobileMenu({ open, onClose }) {
  const location = useLocation()

  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    if (!open) return

    function handleEscape(event) {
      if (event.key === 'Escape') onClose()
    }

    document.body.classList.add('mobile-menu-open')
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.classList.remove('mobile-menu-open')
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  return (
    <>
      <div className={`mobile-menu-backdrop${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside
        className={`mobile-menu-panel${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        aria-label="Mobile navigation"
      >
        <div className="mobile-menu-section">
          <h2 className="mobile-menu-heading">Games</h2>
          <ul className="mobile-menu-list">
            {games.map((game) => (
              <li key={game.slug}>
                <Link to={`/games/${game.slug}`} className="mobile-menu-link">
                  {game.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mobile-menu-section">
          <h2 className="mobile-menu-heading">Studio</h2>
          <ul className="mobile-menu-list">
            <li>
              <Link to="/about-us" className="mobile-menu-link">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div className="mobile-menu-section">
          <h2 className="mobile-menu-heading">Community</h2>
          <div className="mobile-menu-socials">
            {socialLinks.map((link) => (
              <SocialIcon key={link.name} {...link} />
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}
