import GoFundMeWidget from './GoFundMeWidget'

/**
 * Home page "Help Us Build Something Special" block: heading + paragraph
 * pitch + GoFundMe widget (large size).
 *
 * Rendered by `HomePage`. No props.
 *
 * Note: the `<p id="suppo">` id is a partial anchor target from the
 * legacy site; safe to remove if no inbound link uses it.
 */
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
