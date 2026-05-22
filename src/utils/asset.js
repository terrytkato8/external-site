/**
 * Prefix any absolute `/assets/...` path with Vite's `BASE_URL` so it
 * resolves correctly under whatever subpath the site is served from.
 *
 *   prod (base '/'): no-op.
 *   staging (base '/kato8-staging/'): rewrites '/assets/foo.png' to
 *     '/kato8-staging/assets/foo.png'.
 *
 * Works for single `src` values and for `srcSet` strings (which contain
 * multiple paths). Use this on every `/assets/...` reference; a bare
 * absolute path will 404 on staging.
 */
export const asset = (p) =>
  p.replace(/\/assets\//g, `${import.meta.env.BASE_URL}assets/`)
