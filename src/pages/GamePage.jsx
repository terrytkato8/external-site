import { useParams } from 'react-router-dom'
import { getGameBySlug } from '../data/games'
import { gameRoutes } from '../data/seo-config'
import NotFoundPage from './NotFoundPage'
import Seo from '../components/Seo'
import { asset } from '../utils/asset.js'

function RichText({ paragraphs, extraClass = '' }) {
  return (
    <div className={`game-richtext${extraClass ? ` ${extraClass}` : ''} w-richtext`}>
      {paragraphs.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  )
}

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
          <img src={asset('/assets/img/corebound-hero-background.svg')} loading="lazy" alt="" className="game-hero-bg-image" />
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

        {game.conceptArt && game.conceptArt.length > 0 && (
          <section className="games_concept-art-section">
            <div className="games_concept-art-section_title-wrapper">
              <h3 className="games_h3">Concept Art</h3>
            </div>
            <div className="game-concept-art-gallery">
              <div role="list" className="game-concept-art-list w-dyn-items">
                {game.conceptArt.map((art) => (
                  <div key={art.src} role="listitem" className="game-concept-art-list-item w-dyn-item w-dyn-repeater-item">
                    <div className="game-concept-art-item">
                      <img
                        src={art.src}
                        loading="lazy"
                        alt={art.alt}
                        sizes={art.sizes}
                        srcSet={art.srcSet}
                        className="image-35"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </section>
    </section>
  )
}
