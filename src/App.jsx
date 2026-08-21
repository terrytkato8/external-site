import { Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import ConventionBanner from './components/ConventionBanner'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Analytics from './components/Analytics'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import UniversalSerialBladePage from './pages/games/UniversalSerialBladePage'
import LastLightPage from './pages/games/LastLightPage'
import BigBossCleanupPage from './pages/games/BigBossCleanupPage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'

/**
 * Top-level app shell. Mounted by `main.jsx`.
 *
 * Renders the persistent chrome (`Nav` above, `Footer` below) around a
 * `<Routes>` block, plus two zero-render helpers — `ScrollToTop` (resets
 * scroll on route change) and `Analytics` (fires GA `page_view` on route
 * change).
 *
 * Routes:
 *   `/`                → HomePage
 *   `/games/:slug`     → GamePage (404s in-app for unknown slugs)
 *   `/about-us`        → AboutPage
 *   anything else      → NotFoundPage
 *
 * Body class toggle: game pages use `body-2`, everything else uses
 * `body`. The two classes drive different layout styles in CSS
 * (`body-2` removes the max-width constraint so the game-page hero
 * background can span the full viewport).
 */
export default function App() {
  const location = useLocation()
  const isGamePage = location.pathname.startsWith('/games/')
  const bodyClass = isGamePage ? 'body-2' : 'body'

  return (
    <div className={bodyClass}>
      <ScrollToTop />
      <Analytics />
      <ConventionBanner />
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Each game has its own page component (a thin extension of the shared
            GamePage) so the three can diverge; the generic `:slug` route below
            still catches any game without a dedicated component yet. */}
        <Route path="/games/universal-serial-blade" element={<UniversalSerialBladePage />} />
        <Route path="/games/last-light" element={<LastLightPage />} />
        <Route path="/games/big-boss-cleanup" element={<BigBossCleanupPage />} />
        <Route path="/games/:slug" element={<GamePage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  )
}
