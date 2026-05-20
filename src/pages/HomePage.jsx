import Hero from '../components/Hero'
import GameGrid from '../components/GameGrid'
import SupportSection from '../components/SupportSection'
import Seo from '../components/Seo'
import { staticRoutes } from '../data/seo-config'

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
