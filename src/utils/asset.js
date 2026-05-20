// Prefix any absolute `/assets/...` path with Vite's BASE_URL so it resolves
// correctly under whatever subpath the site is served from. With base '/' it's a no-op.
// Works for single src values and for srcSet strings with multiple paths.
export const asset = (p) =>
  p.replace(/\/assets\//g, `${import.meta.env.BASE_URL}assets/`)
