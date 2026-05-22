import Hero from '../components/Hero'
import GameGrid from '../components/GameGrid'
import SupportSection from '../components/SupportSection'
import Seo from '../components/Seo'
import { staticRoutes } from '../data/seo-config'

/**
 * Route: `/`.
 *
 * Composes the home page from three sections, in order:
 *   1. `<Hero>` — logo + tagline
 *   2. `<GameGrid>` — tile per game
 *   3. `<SupportSection>` — GoFundMe pitch + widget
 *
 * SEO meta comes from `staticRoutes['/']` in `src/data/seo-config.js`.
 */
export default function HomePage() {
  return (
    <section className="home-main">
      <Seo path="/" {...staticRoutes['/']} />
      <Hero />
      <GameGrid />
      <SupportSection />
    </section>
  )
}
