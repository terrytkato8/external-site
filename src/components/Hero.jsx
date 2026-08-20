import { asset } from '../utils/asset.js'

/**
 * Home page hero block: studio logo + mission tagline.
 *
 * Rendered by `HomePage` only. No props. The logo (src + alt) and tagline live
 * in `heroContent`, editable via the dev admin (`/__admin`) — the tagline on
 * the Pages tab, the logo on the Branding tab. Both machine-rewrite that block.
 */
const heroContent = {
  logo: {
    src: '/assets/img/anime-type.png',
    alt: 'Kato.8 Studios logo',
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
