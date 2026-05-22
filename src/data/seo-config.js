/**
 * Single source of truth for per-route SEO metadata. Consumed by:
 *   - the `<Seo>` component at runtime (each page passes its own entry).
 *   - `scripts/prerender.mjs` at build time, which iterates
 *     `listPrerenderRoutes()` and bakes the right meta tags into each
 *     route's static HTML file.
 *
 * Pure JS (no Vite/React imports) so it's safely importable from Node.
 *
 * Structure:
 *   SITE              — site-wide constants: canonical URL, default OG image, etc.
 *   staticRoutes      — keyed by pathname for non-dynamic routes ('/', '/about-us').
 *   gameRoutes        — keyed by game slug. Each value spreads into <Seo />.
 *   NOT_FOUND_META    — used by NotFoundPage; emits noindex.
 *   getRouteMeta()    — resolve meta for any pathname.
 *   listPrerenderRoutes() — flat list of routes for the prerender script.
 *
 * To add a new route: add an entry here AND a matching route in App.jsx
 * (and, for games, a matching entry in `src/data/games.js`). Without an
 * entry here, the prerender script won't generate a static HTML file and
 * crawlers will only see the SPA fallback (no route-specific tags on
 * first byte).
 */

export const SITE = {
  url: 'https://kato8studios.com',
  name: 'Kato.8 Studios',
  defaultImage: '/assets/img/kato-webclip.png',
  twitterCard: 'summary_large_image',
}

const HOME_TITLE = 'Kato.8 Studios | Indie Games with Retro-Inspired Heart'

export const staticRoutes = {
  '/': {
    title: HOME_TITLE,
    description:
      'Kato.8 Studios crafts modern indie games with retro-inspired aesthetics and emotional storytelling. Explore our upcoming titles: Corebound, Last Light, and Big Boss Cleanup.',
    ogTitle: 'Welcome to Kato.8 — Where Indie Games Thrive',
    ogDescription:
      'Join us at Kato.8 as we passionately develop captivating indie games. Be inspired and become part of our creative journey!',
  },
  '/about-us': {
    title: 'About Us | Kato.8 Studios',
    description:
      "Kato.8 Studios is dedicated to reviving the heart of gaming. Learn about our mission, our community-first culture, and the story behind the studio's name.",
    ogTitle: 'About Kato.8 Studios',
    ogDescription:
      'Kato.8 Studios crafts meaningful, human-centered games inspired by the classics. Meet the team and learn the story behind our name.',
  },
}

export const gameRoutes = {
  corebound: {
    title: 'Corebound | Kato.8 Studios',
    description:
      'Corebound is a 2D side-scrolling action-adventure set in a post-AI wasteland. Upgrade your body, fight challenging bosses, and discover the truth.',
    ogTitle: 'Corebound — Upgrade your body. Discover the truth.',
    ogDescription:
      'A fast, fluid 2D action-adventure from Kato.8 Studios. Customize your move-set, combo through hordes, and uncover the truth of the AI Apocalypse.',
    ogImage: '/assets/img/corebound-outside-city-concept.jpg',
  },
  'last-light': {
    title: 'Last Light | Kato.8 Studios',
    description:
      'Scavenge, fortify, and endure relentless waves of the undead. Last Light is a survival-strategy game from Kato.8 Studios where every decision counts.',
    ogTitle: 'Last Light — Scavenge. Build. Survive the night.',
    ogDescription:
      'A tense survival game from Kato.8 Studios. Gather resources, build defenses, and outlast escalating zombie hordes.',
  },
  'big-boss-cleanup': {
    title: 'Big Boss Cleanup | Kato.8 Studios',
    description:
      "The battle's over, but the mess remains. Take on the role of gaming's most overworked janitor and clean up the chaotic aftermath of legendary boss fights.",
    ogTitle: "Big Boss Cleanup — Someone has to clean up the heroes' mess.",
    ogDescription:
      'A humorous arcade cleanup game from Kato.8 Studios. Dodge hazards, clear debris, and restore order to arenas ravaged by epic battles.',
  },
}

export const NOT_FOUND_META = {
  title: 'Page not found | Kato.8 Studios',
  description: "The page you're looking for doesn't exist.",
  noindex: true,
}

// Resolve route meta for a given pathname. Used by the Seo component at runtime
// and (indirectly via the route list below) by the prerender script.
export function getRouteMeta(pathname) {
  if (staticRoutes[pathname]) return staticRoutes[pathname]
  const gameMatch = pathname.match(/^\/games\/([^/]+)\/?$/)
  if (gameMatch && gameRoutes[gameMatch[1]]) return gameRoutes[gameMatch[1]]
  return null
}

// All routes the prerender script should emit static HTML for.
export function listPrerenderRoutes() {
  return [
    ...Object.keys(staticRoutes),
    ...Object.keys(gameRoutes).map((slug) => `/games/${slug}`),
  ]
}
