/**
 * Fire a Google Analytics (GA4) custom event.
 *
 * Thin wrapper around `window.gtag('event', …)` so we don't repeat the
 * "is gtag loaded?" guard at every call site. Safely no-ops when `gtag`
 * isn't available — e.g. analytics blocked by the browser, or local dev
 * without the tag in `index.html`. Same guard used by `Analytics.jsx`.
 *
 * The GA base tag (`gtag.js`) and `Analytics.jsx` already cover pageviews;
 * this is for the actions pageviews can't capture — button clicks, outbound
 * link follows, successful form submits. Event names are snake_case per GA4
 * convention; `params` become event parameters visible in GA4 reports.
 *
 *   trackEvent('kickstarter_click', { game: 'Last Light' })
 *
 * @param {string} name - GA4 event name (snake_case).
 * @param {Record<string, unknown>} [params] - Optional event parameters.
 */
export function trackEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
