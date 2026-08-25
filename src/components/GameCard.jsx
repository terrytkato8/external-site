import { Link } from 'react-router-dom'

/**
 * A single game tile on the home page grid.
 *
 * Rendered by `GameGrid` once per entry in `src/data/games.js`.
 *
 * Visual: full-bleed background image (or fallback color) + dark overlay,
 * with an optional game logo, the tagline, and a "Learn More" pill that links
 * to `/games/:slug`. The text title was dropped in the 2026-08 UI/UX pass —
 * the logo carries the game's identity, and a game with no logo art yet simply
 * shows its description. Category badges are hidden by default and only render
 * when a game opts in via `showCategoryBadges` (dev admin → Games tab).
 *
 * Props:
 *   game — game entry from `src/data/games.js`. Uses:
 *     - slug, title, tagline, categories[]
 *     - cardLogo ({ src, alt }, optional) — logo shown in place of the title.
 *       Path is already asset()-prefixed by games.js. Omit until logo art
 *       exists; editable in the dev admin (/__admin) Games tab.
 *     - showCategoryBadges (boolean, optional) — show the category pills
 *       (off by default)
 *     - bgImage (URL, optional; falls back to bgColor)
 *     - bgColor (hex string)
 */
export default function GameCard({ game }) {
  const style = {
    backgroundColor: game.bgColor,
    backgroundImage: game.bgImage ? `url('${game.bgImage}')` : 'none',
  }

  return (
    <div style={style} role="listitem" className="game-card w-dyn-item w-col w-col-4">
      <div className="game-card-overlay">
        <div className="game-card-content">
          {game.showCategoryBadges && game.categories?.length > 0 && (
            <div className="game-card-tags">
              {game.categories.map((category) => (
                <div key={category} className="category category-number">
                  <div className="category-text category-number">{category}</div>
                </div>
              ))}
            </div>
          )}
          {game.cardLogo?.src && (
            <div className="game-card-logo-block">
              <img
                src={game.cardLogo.src}
                loading="lazy"
                alt={game.cardLogo.alt || game.title}
                className="game-card-logo"
              />
            </div>
          )}
          <div className="game-card-description">
            <p>{game.tagline}</p>
          </div>
          <Link to={`/games/${game.slug}`} className="game-card-cta-link w-inline-block">
            <div className="game-card-cta-pill">
              <div className="game-card-cta-label">Learn More</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
