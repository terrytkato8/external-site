import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { games } from '../data/games'
import { socialLinks, SocialIcon } from './SocialIcons'

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
