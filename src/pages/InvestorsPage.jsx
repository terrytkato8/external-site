import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import InvestorRequestForm from '../components/InvestorRequestForm'
import { games } from '../data/games'
import { staticRoutes } from '../data/seo-config'

/**
 * `/investors` — page for prospective investors and publishers.
 *
 *   - Hero on a dark-cobalt band that picks up the nav's cobalt +
 *     pink→peach wave, so the top of the page reads as one piece with
 *     the nav.
 *   - Highlight cards.
 *   - A strip of the studio's games (art + logo + tagline from
 *     `games.js`), linking to each game page.
 *   - The `InvestorRequestForm` contact form.
 *
 * Linked from the "Investors" item in `Nav` and `MobileMenu`. Nav + Footer
 * chrome come from App.jsx, so this renders only the page body.
 */
const HIGHLIGHTS = [
  {
    title: 'Original games',
    body: 'A slate of in-house titles in active development, built to grow a catalog rather than chase a single hit.',
  },
  {
    title: 'A community-first studio',
    body: 'Players follow the work early — playtests, newsletter, and crowdfunding keep the audience close from day one.',
  },
  {
    title: 'Early and hands-on',
    body: 'Partner with us early and help shape where Kato.8 goes next, with direct access to the team.',
  },
]

export default function InvestorsPage() {
  return (
    <main className="investors">
      <Seo path="/investors" {...staticRoutes['/investors']} />
      <header className="investors-hero">
        <div className="investors-hero_inner">
          <div className="investors-hero_content">
            <p className="investors-hero_eyebrow">Investors &amp; Publishers</p>
            <h1 className="investors-hero_title">Partner with Kato.8</h1>
            <p className="investors-hero_lead">
              Kato.8 is an independent game studio building original titles and the
              community around them. We’re opening early conversations with investors
              who want to back that journey and publishers who want to help bring our
              games to more players. Get in touch below and we’ll follow up.
            </p>
          </div>
        </div>
        <svg
          className="investors-hero_wave"
          viewBox="0 0 1440 150"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="investors-ribbon" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#e6738a" />
              <stop offset="1" stopColor="#fecb86" />
            </linearGradient>
          </defs>
          {/* Pink→peach ribbon, then the cobalt band's wavy lower edge over it. */}
          <path
            d="M0 52 C240 92 480 104 720 76 C960 48 1200 44 1440 70 L1440 108 C1200 84 960 88 720 114 C480 140 240 128 0 94 Z"
            fill="url(#investors-ribbon)"
          />
          <path
            d="M0 0 H1440 V70 C1200 44 960 48 720 76 C480 104 240 92 0 52 Z"
            className="investors-hero_wave-band"
          />
        </svg>
      </header>

      <div className="investors-body">
        <section className="investors-highlights" aria-label="Why Kato.8">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="investors-highlight">
              <h2 className="investors-highlight_title">{item.title}</h2>
              <p className="investors-highlight_body">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="investors-games" aria-labelledby="investors-games-heading">
          <h2 id="investors-games-heading" className="investors-games_heading">
            Our games
          </h2>
          <ul className="investors-games_list">
            {games.map((game) => (
              <li key={game.slug}>
                <Link
                  className="investors-game"
                  to={`/games/${game.slug}`}
                  style={{
                    backgroundColor: game.bgColor,
                    backgroundImage: game.bgImage ? `url('${game.bgImage}')` : undefined,
                  }}
                >
                  {game.cardLogo ? (
                    <img className="investors-game_logo" src={game.cardLogo.src} alt={game.title} />
                  ) : (
                    <span className="investors-game_title">{game.title}</span>
                  )}
                  {game.tagline && <span className="investors-game_tagline">{game.tagline}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <InvestorRequestForm source="investors-page" />
      </div>
    </main>
  )
}
