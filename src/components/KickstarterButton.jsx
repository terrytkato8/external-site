import { asset } from '../utils/asset.js'

/**
 * Kickstarter CTA button. Renders on game pages whose data entry has a
 * `kickstarterUrl`. Opens in a new tab. Uses the shared `.kickstarter-button`
 * base + a variant modifier (default `top`) — see `src/styles/main/kickstarter-button.css`.
 */
export default function KickstarterButton({
  href,
  variant = 'top',
  label = 'Back on Kickstarter',
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`kickstarter-button kickstarter-button--${variant}`}
    >
      <img
        src={asset('/assets/img/kickstarter-logo-k-white.svg')}
        alt=""
        className="kickstarter-button_logo"
      />
      <span className="kickstarter-button_text">{label}</span>
      <span className="kickstarter-button_arrow" aria-hidden="true">
        →
      </span>
    </a>
  )
}
