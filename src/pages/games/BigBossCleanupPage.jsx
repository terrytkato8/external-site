import GamePage from '../GamePage'

/**
 * Route: `/games/big-boss-cleanup`.
 *
 * Game-specific page for Big Boss Cleanup. It renders the shared <GamePage> for
 * this slug (all copy/art still come from src/data/games.js); this wrapper is
 * the seam for Big Boss Cleanup-only sections or layout overrides as the page
 * diverges from the others. Wired in App.jsx ahead of the generic
 * `/games/:slug` route.
 */
export default function BigBossCleanupPage() {
  return <GamePage slug="big-boss-cleanup" />
}
