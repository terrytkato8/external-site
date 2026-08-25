import GamePage from '../GamePage'

/**
 * Route: `/games/last-light`.
 *
 * Game-specific page for Last Light. It renders the shared <GamePage> for this
 * slug (all copy/art still come from src/data/games.js); this wrapper is the
 * seam for Last Light-only sections or layout overrides as the page diverges
 * from the others. Wired in App.jsx ahead of the generic `/games/:slug` route.
 */
export default function LastLightPage() {
  return <GamePage slug="last-light" />
}
