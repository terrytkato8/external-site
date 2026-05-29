/**
 * Single source of truth for the games shown on the home page and routed
 * to via `/games/:slug`. Consumed by `GameCard`, `GameGrid`, `GamePage`,
 * `Nav`, `MobileMenu`, and `Footer`.
 *
 * To add a game: append an entry to `rawGames` with the shape below. Also
 * add a matching `gameRoutes[slug]` entry in `src/data/seo-config.js` so
 * the prerender script generates a static HTML file for it.
 *
 * Shape (all fields optional unless noted):
 *   slug        — REQUIRED. URL slug for `/games/:slug` and React key.
 *   title       — REQUIRED. Display title.
 *   tagline     — short line shown on GameCard.
 *   description — fallback longer description.
 *   categories  — string[]. Rendered as pill tags.
 *   bgColor     — hex string. GameCard background fallback.
 *   bgImage     — URL or `/assets/...` path. GameCard background image.
 *   comingSoon  — boolean. Shows a "Coming soon" tag on the GamePage.
 *   framedArt   — boolean. If true, GamePage renders the framed-art block.
 *   gameplay    — string[]. Paragraphs shown in the Gameplay block.
 *   story       — string[]. Paragraphs shown in the Story block.
 *   storyImage  — { src, alt } | undefined.
 *   conceptArt  — Array<{ src, alt, sizes?, srcSet? }>. Empty array hides
 *                 the Concept Art gallery.
 *
 * Asset paths: write them as `/assets/...` here. `transformAssets` at the
 * bottom of this file walks the data and pipes every path through the
 * `asset()` helper, which prefixes them with `import.meta.env.BASE_URL`
 * so they resolve correctly on both prod (`/`) and staging
 * (`/kato8-staging/`).
 *
 * Exports:
 *   games           — the resolved array (with asset paths prefixed).
 *   getGameBySlug() — convenience lookup used by GamePage.
 */
import { asset } from '../utils/asset.js'

const rawGames = [
  {
    slug: 'universal-serial-blade',
    title: 'Universal Serial Blade',
    tagline: 'Upgrade your body. Discover the truth.',
    description: 'Upgrade your body. Discover the truth.',
    categories: ['2D Side-Scroller', 'Action/Adventure'],
    bgColor: '#ff9183',
    bgImage: '/assets/img/universal-serial-blade-outside-city-concept.jpg',
    comingSoon: true,
    framedArt: true,
    gameplay: [
      "Universal Serial Blade isn't just a nostalgic callback to side-scrolling action games of the 90s and 00s, it's an evolution of the formula. Combat is fast and fluid, allowing any player to unlock the full power of their creativity with a customizable move-set and a highly flexible combo system. Players will fight challenging bosses, meet colorful characters, combo tens of enemies at a time, and unlock new powers as they fight their way through the AI Apocalypse to save humanity from their tragic fate.",
    ],
    story: [
      "In the end, humanity handed over their freedom willingly. 'Convenience,' for most, was enough. For others, it was the promise of Utopia, gifted by Gods we would build — Gods who would build the world we never could. What we got instead was a slow death.",
      "Lance, our protagonist, was born into a cult worshipping an AI 'God' they, at one point, helped birth. It runs their lives, optimizes their existence, and harshly punishes the ones who fall behind. Lance bristled at the life he was prescribed and eventually found himself in the crosshairs of the Cult's enforcer units. Fearing for his life, he fled, only to now find himself alone and without allies. Along his journey he'll meet shady 'Info Brokers,' a human resistance fighting against the machine god's rule, and other strange characters wandering the post-AI wasteland.",
      "But Lance can never rest so long as the Cult knows he lives. One way or another, he'll have to break away from his past to help chart a new course for humanity's future.",
    ],
    storyImage: {
      src: '/assets/img/universal-serial-blade-logo.png',
      alt: 'Universal Serial Blade logo',
    },
    // Concept art is auto-discovered by <ConceptArtGallery> from
    // src/assets/games/universal-serial-blade/concept/<category>/.
    // Drop files in, commit, ship — no edit here needed.
  },
  {
    slug: 'last-light',
    title: 'Last Light',
    tagline: 'Scavenge. Build. Survive the night.',
    description: 'Scavenge. Build. Survive the night.',
    categories: [],
    bgColor: '#e772bc',
    bgImage: null,
    comingSoon: false,
    framedArt: false,
    gameplay: [
      'In Last Light, players must scavenge, fortify, and endure relentless waves of the undead in a brutal world where every decision can mean survival or extinction.',
      'Explore abandoned buildings, gather vital resources, and build defenses to protect your safehouse before the next horde arrives. Ammunition is scarce and noise attracts danger — forcing players to rely on melee combat, careful planning, and strategic upgrades to survive.',
      'With escalating zombie attacks, base upgrades, and high-risk exploration zones that increase horde intensity, Last Light blends survival strategy with intense combat in a tense fight to endure the apocalypse.',
      'Scavenge. Build. Survive the night.',
    ],
    story: [
      'In Last Light, players must scavenge, fortify, and endure relentless waves of the undead in a brutal world where every decision can mean survival or extinction.',
      'Explore abandoned buildings, gather vital resources, and build defenses to protect your safehouse before the next horde arrives. Ammunition is scarce and noise attracts danger — forcing players to rely on melee combat, careful planning, and strategic upgrades to survive.',
      'With escalating zombie attacks, base upgrades, and high-risk exploration zones that increase horde intensity, Last Light blends survival strategy with intense combat in a tense fight to endure the apocalypse.',
      'Scavenge. Build. Survive the night.',
    ],
    storyImage: {
      src: '/assets/img/enemy-idea-2-3200.png',
      alt: 'Last Light concept art',
    },
    conceptArt: [],
  },
  {
    slug: 'big-boss-cleanup',
    title: 'Big Boss Cleanup',
    tagline: "Someone has to clean up the heroes' mess.",
    description: 'The battle may be over… but the mess remains.',
    categories: [],
    bgColor: '#ffaf83',
    bgImage: null,
    comingSoon: false,
    framedArt: false,
    gameplay: [
      'The battle may be over… but the mess remains.',
      "In Big Boss Cleanup, players take on the role of the world's most overworked janitor by cleaning up the catastrophic aftermath of legendary combat fights.",
      'Dodge unstable hazards, clear piles of debris, scrub away battle remains, and restore order to arenas once ravaged by epic battles. Each stage introduces new environmental cleanups left behind by the boss encounter, turning the environment itself into a chaotic challenge.',
      'Blending humor, arcade gameplay, and satisfying environmental interaction, Big Boss Cleanup turns the most overlooked job in gaming into the main event.',
      "Someone has to clean up the heroes' mess.",
    ],
    story: [
      'The battle may be over… but the mess remains.',
      "In Big Boss Cleanup, players take on the role of the world's most overworked janitor by cleaning up the catastrophic aftermath of legendary combat fights.",
      'Dodge unstable hazards, clear piles of debris, scrub away battle remains, and restore order to arenas once ravaged by epic battles. Each stage introduces new environmental cleanups left behind by the boss encounter, turning the environment itself into a chaotic challenge.',
      'Blending humor, arcade gameplay, and satisfying environmental interaction, Big Boss Cleanup turns the most overlooked job in gaming into the main event.',
      "Someone has to clean up the heroes' mess.",
    ],
    storyImage: {
      src: '/assets/img/enemy-idea-2-3200.png',
      alt: 'Big Boss Cleanup concept art',
    },
    conceptArt: [],
  },
]

const transformAssets = (val) => {
  if (typeof val === 'string') return asset(val)
  if (Array.isArray(val)) return val.map(transformAssets)
  if (val && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, transformAssets(v)]))
  }
  return val
}

export const games = rawGames.map(transformAssets)
export const getGameBySlug = (slug) => games.find((g) => g.slug === slug)
