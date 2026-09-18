import { asset } from '../utils/asset.js'
import { trackEvent } from '../utils/track.js'

/**
 * Kickstarter CTA button. Renders on game pages whose data entry has a
 * `kickstarterUrl`. Opens in a new tab. Uses the shared `.kickstarter-button`
 * base + a variant modifier (default `top`) — see `src/styles/main/kickstarter-button.css`.
 *
 * Fires a GA4 `kickstarter_click` event (with the game title when provided)
 * on click, before the browser follows the link.
 */
export default function KickstarterButton({
  href,
  variant = 'top',
  label = 'Back on Kickstarter',
  gameTitle,
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`kickstarter-button kickstarter-button--${variant}`}
      onClick={() => trackEvent('kickstarter_click', { game: gameTitle })}
    >
      <img
        src={asset('/assets/img/kickstarter-logo-k-white.svg')}
        alt=""
        className="kickstarter-button_logo"
      />
      <span className="kickstarter-button_text">{label}</span>
    </a>
  )
}
