import GoFundMeWidget from './GoFundMeWidget'

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
      <GoFundMeWidget size="large" />
    </section>
  )
}
