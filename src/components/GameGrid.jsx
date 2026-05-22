import { games } from '../data/games'
import GameCard from './GameCard'

/**
 * The "Games" grid on the home page.
 *
 * Iterates every entry in `src/data/games.js` and renders a `GameCard` for
 * each. Order is the array order in `games.js` — edit there to reorder.
 *
 * Rendered by `HomePage`. No props.
 */
export default function GameGrid() {
  return (
    <section className="games-cards-wrapper">
      <section className="games-list-section">
        <div className="games-card-list-wrapper w-dyn-list">
          <div role="list" className="games-card-list w-dyn-items w-row">
            {games.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}
