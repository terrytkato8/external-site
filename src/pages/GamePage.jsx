import { useParams } from 'react-router-dom'
import { getGameBySlug } from '../data/games'
import { gameRoutes } from '../data/seo-config'
import { playtestEndpoints } from '../data/playtestEndpoints'
import NotFoundPage from './NotFoundPage'
import Seo from '../components/Seo'
import ConceptArtGallery from '../components/ConceptArtGallery'
import PlaytestSignupForm from '../components/PlaytestSignupForm'
import { asset } from '../utils/asset.js'

/**
 * Internal helper. Renders an array of strings as `<p>` paragraphs inside
 * a `.game-richtext` (and `.w-richtext`) wrapper, matching the legacy
 * Webflow rich-text styling. `extraClass` lets a caller add modifiers
 * like 'story'.
 */
function RichText({ paragraphs, extraClass = '' }) {
  return (
    <div className={`game-richtext${extraClass ? ` ${extraClass}` : ''} w-richtext`}>
      {paragraphs.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  )
}

/**
 * Route: `/games/:slug`.
 *
 * Reads `:slug` from the URL, looks up the game in `src/data/games.js`
 * (via `getGameBySlug`), and renders its detail page. If no matching game
 * exists, falls back to `<NotFoundPage>` (so a wrong slug 404s in-app
 * rather than showing a broken layout).
 *
 * Layout:
 *   - Background art: layered desktop background SVG + wireframe overlay
 *     (with responsive srcSet), and a separate mobile background. Note:
 *     desktop bg image is hard-coded to Universal Serial Blade's SVG for now — every
 *     game page uses the same hero background regardless of slug. If you
 *     want per-game backgrounds, move the URL into the game's data entry.
 *   - Hero section: title, tags (incl. "Coming soon" if `game.comingSoon`),
 *     optional framed art (`game.framedArt`), and gameplay copy.
 *   - Story section: long-form story paragraphs + optional `game.storyImage`.
 *   - Concept Art gallery: `<ConceptArtGallery>` reads images from
 *     `src/assets/games/<slug>/concept/<category>/`. Renders nothing if
 *     no images exist for the slug. See the component for the authoring
 *     model ("drop a file in, commit, ship").
 *
 * SEO meta comes from `gameRoutes[slug]` in `src/data/seo-config.js`.
 * Skipped silently if no entry exists for the slug.
 */
export default function GamePage() {
  const { slug } = useParams()
  const game = getGameBySlug(slug)

  if (!game) return <NotFoundPage />

  const seo = gameRoutes[slug]

  return (
    <section className="game-page-main">
      {seo && <Seo path={`/games/${slug}`} {...seo} />}
      <div className="game-hero-bg-wrapper">
        <div className="game-hero-bg-layer">
          <img src={asset('/assets/img/universal-serial-blade-hero-background.svg')} loading="lazy" alt="" className="game-hero-bg-image" />
        </div>
        <div className="game-hero-bg-wireframe">
          <img
            src={asset('/assets/img/wire-layer.webp')}
            loading="lazy"
            sizes="100vw"
            srcSet={asset('/assets/img/wire-layer-500.webp 500w, /assets/img/wire-layer-800.webp 800w, /assets/img/wire-layer-1080.webp 1080w, /assets/img/wire-layer-1600.webp 1600w, /assets/img/wire-layer.webp 1920w')}
            alt=""
            className="game-hero-bg-image"
          />
        </div>
      </div>

      <div className="game-hero-bg-mobile-wrapper">
        <div className="game-hero-bg-mobile-image">
          <img src={asset('/assets/img/mobile-bg.svg')} loading="lazy" alt="" className="game-hero-bg-mobile" />
        </div>
      </div>

      <section className="games_hero-section">
        <div className="games_hero-section_left">
          <div className="games_title-wrapper">
            <div className="games_title-text">
              <h1 className="games_h1">{game.title}</h1>
            </div>
            <div className="title-tags_wrapper">
              {game.comingSoon && (
                <div className="title-tag coming-soon">
                  <div className="title-tag_tag-text">Coming soon</div>
                </div>
              )}
              {game.categories.map((category) => (
                <div key={category} className="title-tag category">
                  <div className="title-tag_tag-text">{category}</div>
                </div>
              ))}
            </div>
          </div>

          {game.framedArt && (
            <div className="games_contest-wrapper">
              <div className="game-hero-art-wrapper">
                <div className="game-framed-art">
                  <img src={asset('/assets/img/game-framed-art.svg')} loading="lazy" alt="" className="game-hero-art-frame-desktop" />
                </div>
              </div>
              <div className="game-hero-art-mobile">
                <div className="game-framed-art">
                  <img src={asset('/assets/img/game-framed-art-mobile.svg')} loading="lazy" alt="" className="game-hero-art-frame-mobile" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="games_hero-section_right">
          <div className="game-info-panel">
            <div className="game-gameplay-desktop">
              <div className="game-gameplay-inner">
                <div className="game-gameplay-heading-wrapper">
                  <h3 className="game-section-heading">Gameplay</h3>
                </div>
                <div className="game-gameplay-text-wrapper">
                  <RichText paragraphs={game.gameplay} />
                </div>
              </div>
            </div>

            <div className="game-gameplay-mobile">
              <h3 className="game-section-heading">Gameplay</h3>
              <RichText paragraphs={game.gameplay} />
            </div>
          </div>
        </div>
      </section>

      <section className="games_showcase-section">
        <section className="game-story-section">
          <div className="game-story-layout">
            <div className="game-story-desktop">
              <div className="game-story-inner">
                <div className="game-gameplay-heading-wrapper">
                  <h3 className="game-section-heading">Story</h3>
                </div>
                <div className="game-gameplay-text-wrapper">
                  <RichText paragraphs={game.story} extraClass="story" />
                </div>
              </div>
            </div>

            <div className="game-story-mobile">
              <h3 className="game-section-heading">Story</h3>
              <RichText paragraphs={game.story} extraClass="story" />
            </div>
          </div>

          {game.storyImage && (
            <div className="game-story-image-wrapper">
              <img src={game.storyImage.src} loading="lazy" alt={game.storyImage.alt} className="game-story-image" />
            </div>
          )}
        </section>
      </section>

      <ConceptArtGallery gameSlug={game.slug} />

      <PlaytestSignupForm
        key={game.slug}
        source={`${game.slug}-page`}
        gameTitle={game.title}
        endpoint={playtestEndpoints[game.slug]}
      />
    </section>
  )
}
