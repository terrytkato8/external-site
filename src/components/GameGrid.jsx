import { games } from '../data/games'
import GameCard from './GameCard'

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
