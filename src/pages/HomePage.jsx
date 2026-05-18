import Hero from '../components/Hero'
import GameGrid from '../components/GameGrid'
import SupportSection from '../components/SupportSection'

export default function HomePage() {
  return (
    <section className="home-main">
      <Hero />
      <GameGrid />
      <SupportSection />
    </section>
  )
}
