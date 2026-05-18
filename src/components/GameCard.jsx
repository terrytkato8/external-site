import { Link } from 'react-router-dom'

export default function GameCard({ game }) {
  const style = {
    backgroundColor: game.bgColor,
    backgroundImage: game.bgImage ? `url('${game.bgImage}')` : 'none',
  }

  return (
    <div style={style} role="listitem" className="game-card w-dyn-item w-col w-col-4">
      <div className="game-card-overlay">
        <div className="game-card-content">
          <div className="game-card-tags">
            {game.categories.map((category) => (
              <div key={category} className="category category-number">
                <div className="category-text category-number">{category}</div>
              </div>
            ))}
          </div>
          <div className="game-card-title-block">
            <h2 className="game-card-title">{game.title}</h2>
          </div>
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
