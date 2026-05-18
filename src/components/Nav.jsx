import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { games } from '../data/games'
import { socialLinks, SocialIcon } from './SocialIcons'
import MobileMenu from './MobileMenu'

export default function Nav() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!dropdownOpen) return

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setDropdownOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [dropdownOpen])

  const closeDropdown = () => setDropdownOpen(false)

  return (
    <div className="nav">
      <div
        data-duration="400"
        data-animation="default"
        data-easing2="ease"
        data-easing="ease"
        data-collapse="medium"
        role="banner"
        data-no-scroll="1"
        className="nav_container w-nav"
      >
        <div className="nav_left">
          <Link to="/" className="nav_logo w-inline-block">
            <div className="nav-logo-inner">
              <div className="nav_logo-icon">
                <svg width="100%" height="100%" viewBox="0 0 33 33" preserveAspectRatio="xMidYMid meet" className="svg" />
              </div>
            </div>
          </Link>
        </div>

        <div className="nav_right">
          <div ref={dropdownRef} data-hover="false" data-delay="0" className={`w-dropdown${dropdownOpen ? ' w--open' : ''}`}>
            <div
              className={`w-dropdown-toggle${dropdownOpen ? ' w--open' : ''}`}
              role="button"
              tabIndex={0}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setDropdownOpen((open) => !open)
                }
              }}
            >
              <div className="nav-dropdown-caret w-icon-dropdown-toggle" />
              <div className="nav-games-label">Games</div>
            </div>
            <nav className={`nav-games-dropdown w-dropdown-list${dropdownOpen ? ' w--open' : ''}`}>
              <div className="nav-games-list-wrapper w-dyn-list">
                <div role="list" className="nav-games-list w-dyn-items">
                  {games.map((game) => (
                    <div key={game.slug} role="listitem" className="nav-games-item w-dyn-item">
                      <Link to={`/games/${game.slug}`} className="link" onClick={closeDropdown}>
                        {game.title}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </nav>
          </div>

          <nav role="navigation" className="nav_menu w-nav-menu">
            <ul role="list" className="nav_menu-list w-list-unstyled" />
          </nav>

          <Link to="/about-us" className="nav-about-link">
            About
          </Link>

          <div className="nav-social-icons">
            {socialLinks.map((link) => (
              <SocialIcon key={link.name} {...link} />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`nav-hamburger${mobileOpen ? ' is-open' : ''}`}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu-panel"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="nav-hamburger-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  )
}
