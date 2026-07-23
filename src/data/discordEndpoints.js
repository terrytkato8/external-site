/**
 * Per-game Discord community sign-up endpoints, keyed by game slug.
 *
 * URLs are hardcoded because Formspree endpoints are public by design
 * (the browser POSTs directly to them), so there's no benefit to
 * storing them as build-time env vars — the built JS would contain
 * the same string anyway. Source of truth for the mapping lives in
 * `FORMSPREE.md` in the prod repo; keep both in sync when rotating
 * or adding endpoints.
 *
 * Consumed by `GamePage.jsx` via `discordEndpoints[slug]`. A missing
 * entry evaluates to `undefined`, in which case `DiscordSignupForm`
 * skips the network call and still shows the success state — useful
 * for a new game before its endpoint exists.
 */
export const discordEndpoints = {
  'universal-serial-blade': 'https://formspree.io/f/mkodqogv',
  'last-light': 'https://formspree.io/f/mpqvyqwl',
  'big-boss-cleanup': 'https://formspree.io/f/xrenpjrq',
}
