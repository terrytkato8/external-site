import { useParams } from 'react-router-dom'
import { getGameBySlug } from '../data/games'
import { gameRoutes } from '../data/seo-config'
import { playtestEndpoints } from '../data/playtestEndpoints'
import { discordEndpoints } from '../data/discordEndpoints'
import NotFoundPage from './NotFoundPage'
import Seo from '../components/Seo'
import ConceptArtGallery from '../components/ConceptArtGallery'
import PlaytestSignupForm from '../components/PlaytestSignupForm'
import DiscordSignupForm from '../components/DiscordSignupForm'
import KickstarterButton from '../components/KickstarterButton'
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
 *   - Background art (desktop only): the layered hero backdrop comes from
 *     `game.heroBackground` — `primary` is the base layer, `overlay` a second
 *     layer above it, and `anchorTop` pins the block to the top of the window.
 *     A game with no `heroBackground` renders no backdrop. Below 991px the
 *     desktop backdrop is hidden and a decorative band shows instead — it
 *     reuses `heroBackground.primary`, falling back to `mobile-bg.svg`.
 *   - Hero section: title, the "Coming soon" status badge (if `game.comingSoon`),
 *     category badges (only if `game.showCategoryBadges` — off by default),
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
export default function GamePage({ slug: slugProp }) {
  const params = useParams()
  // Per-game wrapper components (src/pages/games/*) pass an explicit `slug`;
  // the generic `/games/:slug` route falls back to the URL param.
  const slug = slugProp ?? params.slug
  const game = getGameBySlug(slug)

  if (!game) return <NotFoundPage />

  // Mobile/tablet (≤991px) hides the desktop hero backdrop and shows this
  // decorative band instead. Drive it from the game's own heroBackground so an
  // admin change lands on every breakpoint, not just desktop; fall back to the
  // shared decorative SVG for games with no backdrop set. `heroBackground.primary`
  // is already asset()-prefixed by games.js; the fallback needs prefixing here.
  const mobileHeroBg = game.heroBackground?.primary || asset('/assets/img/mobile-bg.svg')

  const seo = gameRoutes[slug]

  return (
    <section className={`game-page-main game-page-${slug}`}>
      {seo && <Seo path={`/games/${slug}`} {...seo} />}
      {(game.heroBackground?.primary || game.heroBackground?.overlay) && (
        <div className={`game-hero-bg-wrapper${game.heroBackground.anchorTop ? ' anchor-top' : ''}`}>
          {game.heroBackground.primary && (
            <div className="game-hero-bg-layer">
              <img src={game.heroBackground.primary} loading="lazy" alt="" className="game-hero-bg-image" />
            </div>
          )}
          {game.heroBackground.overlay && (
            <div className="game-hero-bg-wireframe">
              <img src={game.heroBackground.overlay} loading="lazy" alt="" className="game-hero-bg-image" />
            </div>
          )}
        </div>
      )}

      <section className="games_hero-section">
        <div className="games_hero-section_left">
          <div className="games_title-wrapper">
            <div className="games_title-text">
              <h1 className="games_h1">
                {game.pageLogo?.src ? (
                  <img src={game.pageLogo.src} alt={game.pageLogo.alt || game.title} className="games_title-logo" />
                ) : (
                  game.title
                )}
              </h1>
            </div>
            {/* Title tags: "Coming soon" shows when `game.comingSoon`; genre
              * category badges show only when `game.showCategoryBadges` (an
              * admin toggle, off by default). Both hidden by default. */}
            <div className="title-tags_wrapper">
              {game.comingSoon && (
                <div className="title-tag coming-soon">
                  <div className="title-tag_tag-text">Coming soon</div>
                </div>
              )}
              {game.showCategoryBadges &&
                game.categories.map((category) => (
                  <div key={category} className="title-tag category">
                    <div className="title-tag_tag-text">{category}</div>
                  </div>
                ))}
            </div>

            {/* Mobile-only decorative band behind the title block. It lives
              * inside the title wrapper so its bottom edge can be anchored to
              * the bottom of the tags — see games.css. Hidden above 767px. */}
            <div className={`game-hero-bg-mobile-wrapper${game.heroBackground?.anchorTop ? ' anchor-top' : ''}`}>
              <div className="game-hero-bg-mobile-image">
                <img src={mobileHeroBg} loading="lazy" alt="" className="game-hero-bg-mobile" />
              </div>
            </div>
          </div>

          {game.kickstarterUrl && (
            <div className="game-hero-kickstarter">
              <KickstarterButton href={game.kickstarterUrl} />
            </div>
          )}

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
        key={`playtest-${game.slug}`}
        source={`${game.slug}-page`}
        gameTitle={game.title}
        endpoint={playtestEndpoints[game.slug]}
      />

      <DiscordSignupForm
        key={`discord-${game.slug}`}
        source={`${game.slug}-page`}
        gameTitle={game.title}
        endpoint={discordEndpoints[game.slug]}
      />
    </section>
  )
}
