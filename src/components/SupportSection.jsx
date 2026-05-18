export default function SupportSection() {
  return (
    <section className="support-section">
      <div>
        <h2 className="support-section_heading">Help Us Build Something Special</h2>
      </div>
      <div className="support-cta-wrapper">
        <p id="suppo" className="support-description">
          Kato.8 is an indie studio built from passion, not a publisher's budget. Be part of the journey from the very beginning and help us bring
          retro-inspired games back to life.
        </p>
      </div>
      <a
        href="https://www.gofundme.com/f/help-launch-my-retro-game-studio"
        target="_blank"
        rel="noopener noreferrer"
        className="gofundme-button w-inline-block"
      >
        <div className="gofundme-button-inner">
          <div>
            <img src="/Assets/img/solar-heart-bold.svg" loading="lazy" alt="" />
          </div>
          <div className="gofundme-label">
            <div className="gofundme-button-label">Back Us On GoFundMe</div>
          </div>
        </div>
      </a>
      <div className="gofundme-logo-wrapper">
        <img
          src="/Assets/img/gofundme-logo.png"
          loading="lazy"
          sizes="(max-width: 1280px) 100vw, 1280px"
          srcSet="/Assets/img/gofundme-logo-500.png 500w, /Assets/img/gofundme-logo-800.png 800w, /Assets/img/gofundme-logo-1080.png 1080w, /Assets/img/gofundme-logo.png 1280w"
          alt="GoFundMe"
          className="gofundme-logo-image"
        />
      </div>
    </section>
  )
}
