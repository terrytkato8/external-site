import Hero, { heroContent } from '../components/Hero'
import GameGrid from '../components/GameGrid'
import SupportSection from '../components/SupportSection'
import Seo from '../components/Seo'
import { staticRoutes } from '../data/seo-config'
import { asset } from '../utils/asset.js'

/**
 * Route: `/`.
 *
 * Composes the home page from three sections, in order:
 *   1. `<Hero>` — logo + tagline
 *   2. `<GameGrid>` — tile per game
 *   3. `<SupportSection>` — GoFundMe pitch + widget
 *
 * The fixed/parallax backdrop (`heroContent.background`) is painted directly on
 * `.home-main` as two stacked backgrounds — a translucent white scrim over the
 * art — with `background-attachment: fixed` (see home.css) so the art holds
 * still while the sections scroll in front of it. The scrim keeps the page's
 * light styling and text legibility; tune its alpha here. Mobile falls back to
 * a scrolling attachment (iOS ignores `fixed`) via a media query in home.css.
 *
 * SEO meta comes from `staticRoutes['/']` in `src/data/seo-config.js`.
 */
const SCRIM = 'rgba(255, 255, 255, 0.62)'

export default function HomePage() {
  const bg = heroContent.background?.src
  const style = bg
    ? { backgroundImage: `linear-gradient(${SCRIM}, ${SCRIM}), url('${asset(bg)}')` }
    : undefined

  return (
    <section className={`home-main${bg ? ' has-fixed-bg' : ''}`} style={style}>
      <Seo path="/" {...staticRoutes['/']} />
      <Hero />
      <GameGrid />
      <SupportSection />
    </section>
  )
}
