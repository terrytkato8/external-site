import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { games } from '../data/games'
import { asset } from '../utils/asset.js'
import { socialLinks, SocialIcon } from './SocialIcons'
import MobileMenu from './MobileMenu'

/**
 * The "Games" dropdown — the toggle plus the list of every game in
 * `src/data/games.js`. Closes on outside click, Escape, or picking a link.
 * Owns its own open state so it can be dropped into both the main nav and the
 * compact pinned bar without the two sharing (or fighting over) one state.
 */
function GamesDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={ref} data-hover="false" data-delay="0" className={`w-dropdown${open ? ' w--open' : ''}`}>
      <div
        className={`w-dropdown-toggle${open ? ' w--open' : ''}`}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen((o) => !o)
          }
        }}
      >
        <div className="nav-dropdown-caret w-icon-dropdown-toggle" />
        <div className="nav-games-label">Games</div>
      </div>
      <nav className={`nav-games-dropdown w-dropdown-list${open ? ' w--open' : ''}`}>
        <div className="nav-games-list-wrapper w-dyn-list">
          <div role="list" className="nav-games-list w-dyn-items">
            {games.map((game) => (
              <div key={game.slug} role="listitem" className="nav-games-item w-dyn-item">
                <Link to={`/games/${game.slug}`} className="link" onClick={() => setOpen(false)}>
                  {game.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}

/**
 * Top navigation.
 *
 * Rendered once at the app root in App.jsx (appears on every page).
 *
 * Two bars:
 *   - The main tall wavy header (in-flow at the top): logo, Games dropdown,
 *     About, socials on desktop; hamburger → MobileMenu on mobile.
 *   - A compact pinned bar (`.nav-compact`) that slides down once the user
 *     scrolls past the header, so navigation stays reachable — handy for a
 *     phone visitor who scanned a convention QR. Same controls, slimmed down.
 *
 * Nav owns the mobile-menu open state (both hamburgers toggle it) and the
 * `scrolled` flag that reveals the compact bar. Each `GamesDropdown` owns its
 * own open state.
 *
 * No props.
 */
export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Reveal the compact bar once past the tall header (~its own height).
    const onScroll = () => setScrolled(window.scrollY > 160)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <GamesDropdown />

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

      {/* Compact pinned bar — appears on scroll. Reuses the main nav's controls. */}
      <div className={`nav-compact${scrolled ? ' is-visible' : ''}`} aria-hidden={!scrolled}>
        <div className="nav-compact-inner">
          <Link to="/" className="nav-compact-logo w-inline-block" aria-label="Kato.8 Studios home">
            <img src={asset('/assets/img/logo-no-mouth.png')} alt="" className="nav-compact-logo-img" />
          </Link>

          <div className="nav-compact-right">
            <GamesDropdown />
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
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  )
}
