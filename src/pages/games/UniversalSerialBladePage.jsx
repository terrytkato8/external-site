import GamePage from '../GamePage'

/**
 * Route: `/games/universal-serial-blade`.
 *
 * Game-specific page for Universal Serial Blade. It renders the shared
 * <GamePage> for this slug (all copy/art still come from src/data/games.js);
 * this wrapper is the seam for USB-only sections or layout overrides as the
 * page diverges from the others. Wired in App.jsx ahead of the generic
 * `/games/:slug` route.
 */
export default function UniversalSerialBladePage() {
  return <GamePage slug="universal-serial-blade" />
}
