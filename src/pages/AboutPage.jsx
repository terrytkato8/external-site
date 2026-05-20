import GoFundMeWidget from '../components/GoFundMeWidget'
import Seo from '../components/Seo'
import { staticRoutes } from '../data/seo-config'
import { asset } from '../utils/asset.js'

export default function AboutPage() {
  return (
    <>
      <Seo path="/about-us" {...staticRoutes['/about-us']} />
      <section>
        <div className="about-us-section">
          <img src={asset('/assets/img/logo-no-mouth.png')} loading="lazy" width="203" alt="Kato.8 Studios mascot" className="image-4" />
          <div className="about-us-text">
            <div className="text-14">About Us</div>
            <div className="text-15">
              Kato.8 Studios is dedicated to reviving the heart of gaming. We create games for gamers, by gamers; crafting meaningful, human-centered
              experiences inspired by the classics that shaped us. Our mission is to foster a studio culture where every developer is valued and heard,
              ensuring that creativity thrives. We are committed to delivering authentic worlds filled with genuine passion, while continually engaging with
              our community to evolve and innovate.
            </div>
          </div>
        </div>
      </section>

      <section className="section-5">
        <div className="group-why-kato8">
          <div className="why-kato8-content">
            <div className="text-12">Why Kato.8?</div>
            <div className="text-13">
              Kato.8 Studios is named after its founder Terry's dog, Kato, with the "8" inspired by a stuffed plush toy that was his favorite chew toy. The
              name is deeply personal and reflects the heart behind why this studio exists. Kato was a constant source of joy, playfulness, and inspiration
              in Terry's life, and that spirit is something the studio wants carried into the work we do. Kato.8 serves as a reminder to build something
              meaningful, playful, and heartfelt: both in the games we create and in the kind of creative culture we strive to foster.
            </div>
          </div>
          <img
            src={asset('/assets/img/kato-dog.jpg')}
            loading="lazy"
            sizes="100vw"
            srcSet={asset('/assets/img/kato-dog-500.jpg 500w, /assets/img/kato-dog-800.jpg 800w, /assets/img/kato-dog-1080.jpg 1080w, /assets/img/kato-dog.jpg 1132w')}
            alt="Kato, the dog the studio is named after"
            className="image-3"
          />
        </div>
      </section>

      <div className="support-kato8-section">
        <div className="frame-122">
          <div className="support-section_heading">Support Kato.8</div>
          <div className="paragraph-2">
            If you'd like to support the early stages of Kato.8's journey, you can learn more about our plans and contribute through our GoFundMe. Every bit
            of support helps move the studio one step closer to our first release.
          </div>
        </div>
        <GoFundMeWidget size="large" />
      </div>
    </>
  )
}
