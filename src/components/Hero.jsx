import { asset } from '../utils/asset.js'

/**
 * Home page hero block: studio logo + mission tagline.
 *
 * Rendered by `HomePage` only. No props. Logo image uses srcSet for
 * responsive sizing (500w / 624w variants in `public/assets/img/`).
 *
 * The tagline lives in `heroContent` — editable by hand or via the dev
 * admin's Pages tab (`/__admin`), which machine-rewrites that block.
 */
const heroContent = {
  tagline:
    'Kato.8 Studios is dedicated to reviving the heart of gaming. We create games for gamers, by gamers; crafting modern games with retro-inspired aesthetics, mechanics, and emotional engagement.',
}

export default function Hero() {
  return (
    <section className="home-hero-intro">
      <div className="hero-logo-wrapper">
        <img
          src={asset('/assets/img/anime-type.png')}
          loading="lazy"
          sizes="(max-width: 624px) 100vw, 624px"
          srcSet={asset('/assets/img/anime-type-500.png 500w, /assets/img/anime-type.png 624w')}
          alt="Kato.8 Studios logo"
          className="hero-logo-image"
        />
      </div>
      <div className="hero-tagline-wrapper">
        <p className="hero-intro-paragraph">{heroContent.tagline}</p>
      </div>
    </section>
  )
}
