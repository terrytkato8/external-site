/**
 * Per-game playtest sign-up endpoints, keyed by game slug.
 *
 * URLs are hardcoded because Formspree endpoints are public by design
 * (the browser POSTs directly to them), so there's no benefit to
 * storing them as build-time env vars — the built JS would contain
 * the same string anyway. Source of truth for the mapping lives in
 * `FORMSPREE.md` in the prod repo; keep both in sync when rotating
 * or adding endpoints.
 *
 * Consumed by `GamePage.jsx` (USB, Big Boss Cleanup) and
 * `SimpleGamePage.jsx` (Last Light), both via `playtestEndpoints[slug]`.
 * A missing entry evaluates to `undefined`, in which case
 * `PlaytestSignupForm` skips the network call and still shows the
 * success state — useful for a new game before its endpoint exists.
 */
export const playtestEndpoints = {
  'universal-serial-blade': 'https://formspree.io/f/xqerpngw',
  'last-light': 'https://formspree.io/f/xykreobv',
  'big-boss-cleanup': 'https://formspree.io/f/mojgerpg',
}
