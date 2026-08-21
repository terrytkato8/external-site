import { asset } from '../utils/asset.js'

/**
 * Home page hero block: studio logo + mission tagline.
 *
 * Rendered by `HomePage` only. No props. The logo (src + alt), tagline, and
 * fixed background live in `heroContent`, editable via the dev admin
 * (`/__admin`) — the tagline on the Pages tab, the logo + background on the
 * Branding tab. All machine-rewrite that block.
 *
 * `background` is the home page's fixed/parallax backdrop: `HomePage` paints
 * `background.src` (under a white scrim) on `.home-main` with
 * `background-attachment: fixed`, so the art stays put while the page scrolls
 * in front of it. Empty `src` = no backdrop (plain white home page).
 * `heroContent` is exported so HomePage can read the background path.
 */
export const heroContent = {
        logo: {
          src: '/assets/img/anime-type.png',
          alt: 'Kato.8 Studios logo',
        },
        background: {
          alt: '',
        },
        tagline:
          'Kato.8 Studios is dedicated to reviving the heart of gaming. We create games for gamers, by gamers; crafting modern games with retro-inspired aesthetics, mechanics, and emotional engagement.',
      }

export default function Hero() {
  return (
    <section className="home-hero-intro">
      <div className="hero-logo-wrapper">
        <img
          src={asset(heroContent.logo.src)}
          loading="lazy"
          alt={heroContent.logo.alt}
          className="hero-logo-image"
        />
      </div>
      <div className="hero-tagline-wrapper">
        <p className="hero-intro-paragraph">{heroContent.tagline}</p>
      </div>
    </section>
  )
}
